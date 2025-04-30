---
published: true
abbrlink: 4
date: 2023-07-12 15:54:42
title: MYDB
---

### 整体结构

MYDB 分为后端和前端，前后端通过 socket 进行交互。前端（客户端）的职责很单一，读取用户输入，并发送到后端执行，输出返回结果，并等待下一次输入。MYDB 后端则需要解析 SQL，如果是合法的 SQL，就尝试执行并返回结果。不包括解析器，MYDB 的后端划分为五个模块，每个模块都又一定的职责，通过接口向其依赖的模块提供方法。五个模块如下：
1. Transaction Manager（TM）
2. Data Manager（DM）
3. Version Manager（VM）
4. Index Manager（IM）
5. Table Manager（TBM）
![](https://shinya.click/images/mydb0.jpg)

创建数据库目录
```bash
mvn exec:java '-Dexec.mainClass="top.guoziyang.mydb.backend.Launcher"' '-Dexec.args="-create F:\\WorkSpace\JavaWeb\MYDB\db_loc\db"'
```
启动数据库服务
```bash
	mvn exec:java '-Dexec.mainClass="top.guoziyang.mydb.backend.Launcher"' '-Dexec.args="-open F:\\WorkSpace\JavaWeb\MYDB\db_loc\db"'
```
这时数据库服务就已经启动在本机的 9999 端口。重新启动一个终端，执行以下命令启动客户端连接数据库：
```bash
mvn exec:java '-Dexec.mainClass="top.guoziyang.mydb.client.Launcher"'
```

# Transaction Manager（TM）
> TM 通过维护 XID 文件来维护事务的状态，并提供接口供其他模块来查询某个事务的状态。

每个事务都有一个XID，这个ID**唯一标识**了这个事务。从1开始。并**特殊**规定0是一个超级事务，当一些操作想在没有申请事务的情况下进行，那么可以将操作的 XID 设置为 0。XID 为 0 的事务的状态永远是 committed。

TransactionManager 维护了一个 XID 格式的文件，用来记录各个事务的状态。MYDB 中，每个事务都有下面的**三种状态**：

1. active，正在进行，尚未结束
2. committed，已提交
3. aborted，已撤销（回滚）
- TransactionManager 负责维护一个 XID 格式的文件，用于记录各个事务的状态。
    
- XID 文件中为每个事务分配了一个字节的空间，用来保存其状态。
    
- XID 文件的头部保存了一个 8 字节的数字，记录了这个 XID 文件管理的事务的个数。
    
- 因此，事务 XID 在文件中的状态存储在 (XID-1)+8 字节的位置处，其中 XID-1 是因为 XID 0（超级事务）的状态不需要记录。
![](https://pic.zjcspace.xyz/b/202407211936467.png)

在`TransactionManager`中提供了一些接口供其他模块调用，用来创建事务和查询事务的状态；

```java
public interface TransactionManager {
    long begin(); //开启事务
    void commit(long xid);  //提交事务
    void abort(long xid);   //撤销或回滚事务
    boolean isActive(long xid); //查询一个事务的状态是否正在运行
    boolean isCommitted(long xid);  //查询一个事务的状态是否已经提交
    boolean isAborted(long xid);    //查询一个事务的状态是否撤销或回滚
    void close();   //关闭事务
}
```
## 如何实现TM？

定义常量：
```java
// XID文件头长度
static final int LEN_XID_HEADER_LENGTH = 8;
// 每个事务的占用长度
private static final int XID_FIELD_SIZE = 1;
// 事务的三种状态
private static final byte FIELD_TRAN_ACTIVE   = 0;
private static final byte FIELD_TRAN_COMMITTED = 1;
private static final byte FIELD_TRAN_ABORTED  = 2;
// 超级事务，永远为commited状态
public static final long SUPER_XID = 0;
// XID 文件后缀
static final String XID_SUFFIX = ".xid";

```
文件读写都采用了 NIO 方式的 FileChannel，读写方式都和传统 IO 的 Input/Output Stream 都有一些区别，不过区别主要是接口方面，熟悉使用即可。

TM在初始化时，会检测XID文件的合法性，具体是通过检测头信息的期望长度和文件的实际长度做对比，如果不同，说明XID文件不合法，抛出异常。
对于校验没有通过的，会直接通过 panic 方法，强制停机。在一些基础模块中出现错误都会如此处理，无法恢复的错误只能直接停机。
![checkXidCounter.jpg](https://cdn.nlark.com/yuque/0/2024/jpeg/22796888/1713080408220-5daf7b9f-4683-4a73-80eb-23e5aa8213df.jpeg#averageHue=%23fdfdfc&clientId=u7a44b2f6-3158-4&from=paste&height=769&id=ua47dde84&originHeight=961&originWidth=667&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=38141&status=done&style=none&taskId=ua7fd9621-a4b8-4741-8943-b0e83550159&title=&width=533.6)
然后是一些事务xid的相关api:
```java
public class TransactionManagerImpl implements TransactionManager {

    // XID文件头长度
    static final int LEN_XID_HEADER_LENGTH = 8;
    // 每个事务的占用长度
    private static final int XID_FIELD_SIZE = 1;

    // 事务的三种状态
    private static final byte FIELD_TRAN_ACTIVE   = 0;
	private static final byte FIELD_TRAN_COMMITTED = 1;
	private static final byte FIELD_TRAN_ABORTED  = 2;

    // 超级事务，永远为commited状态
    public static final long SUPER_XID = 0;

    static final String XID_SUFFIX = ".xid";
    
    private RandomAccessFile file;
    private FileChannel fc;
    private long xidCounter;
    private Lock counterLock;

    // 初始化，获得使用的文件指针和文件通道
    TransactionManagerImpl(RandomAccessFile raf, FileChannel fc) {
        this.file = raf;
        this.fc = fc;
        counterLock = new ReentrantLock();
        checkXIDCounter();
    }

    /**
     * 检查XID文件是否合法
     * 读取XID_FILE_HEADER中的xidcounter，根据它计算文件的理论长度，对比实际长度
     */
    private void checkXIDCounter() {
        // 初始化文件长度
        long fileLen = 0;
        try {
            // 获得文件长度,RandomAccessFile在构造函数中赋值
            fileLen = file.length();
        } catch (IOException e1) {
            // 读取过程出错，则抛出BadXIDFileException错误
            Panic.panic(Error.BadXIDFileException);
        }
        // 如果文件长度小于XID头部长度，抛出BadXIDFileException错误
        if(fileLen < LEN_XID_HEADER_LENGTH) {
            Panic.panic(Error.BadXIDFileException);
        }

        // 在内存中分配一个长度为XID头部长度的ByteBuffer
        ByteBuffer buf = ByteBuffer.allocate(LEN_XID_HEADER_LENGTH);
        try {
            // 将文件通道的位置设置为0，从文件起始位置读取
            fc.position(0);
            // 尝试将数据从通道中读取并写入到缓冲区 buf
            fc.read(buf);
        } catch (IOException e) {
            // 如果读取过程出现异常，抛出错误
            Panic.panic(e);
        }
        // 把header的8字节转化为字节数组然后进一步解析为Long类型
        this.xidCounter = Parser.parseLong(buf.array());
        // 根据header的Xid条目大小判断，是否和文件实际长度符合
        long end = getXidPosition(this.xidCounter + 1);
        if(end != fileLen) {
            Panic.panic(Error.BadXIDFileException);
        }
    }

    // 根据事务xid取得其在xid文件中对应的位置
    // xid!=0，因为它是超级事务。
    private long getXidPosition(long xid) {
        return LEN_XID_HEADER_LENGTH + (xid-1)*XID_FIELD_SIZE;
    }

    // 更新xid事务的状态为status
    private void updateXID(long xid, byte status) {
        // 获得xid条目应该插入的位置
        long offset = getXidPosition(xid);
        byte[] tmp = new byte[XID_FIELD_SIZE];
        // 在当前item存储该事务xid对应状态，该id不需要存储，因为其在文件位置隐含了xid
        tmp[0] = status;
        // 将字节数组包装到缓冲区中。
        ByteBuffer buf = ByteBuffer.wrap(tmp);
        try {
            // 写入磁盘
            fc.position(offset);
            fc.write(buf);
        } catch (IOException e) {
            Panic.panic(e);
        }
        try {
            // 强制将文件通道中的所有未写入的数据写入到磁盘
            fc.force(false);
        } catch (IOException e) {
            Panic.panic(e);
        }
    }

    // 将XID加一，并更新XID Header
    private void incrXIDCounter() {
        xidCounter ++;
        ByteBuffer buf = ByteBuffer.wrap(Parser.long2Byte(xidCounter));
        try {
            fc.position(0);
            fc.write(buf);
        } catch (IOException e) {
            Panic.panic(e);
        }
        try {
            fc.force(false);
        } catch (IOException e) {
            Panic.panic(e);
        }
    }

    // 开始一个事务，并返回XID
    public long begin() {
        // 锁定计数器，防止并发问题
        counterLock.lock();
        try {
            //自增xid
            long xid = xidCounter + 1;
            // 写入
            updateXID(xid, FIELD_TRAN_ACTIVE);
            incrXIDCounter();
            return xid;
        } finally {
            counterLock.unlock();
        }
    }

    // 提交XID事务
    public void commit(long xid) {
        updateXID(xid, FIELD_TRAN_COMMITTED);
    }

    // 回滚XID事务
    public void abort(long xid) {
        updateXID(xid, FIELD_TRAN_ABORTED);
    }

    // 检测XID事务是否处于status状态
    private boolean checkXID(long xid, byte status) {
        long offset = getXidPosition(xid);
        ByteBuffer buf = ByteBuffer.wrap(new byte[XID_FIELD_SIZE]);
        try {
            fc.position(offset);
            fc.read(buf);
        } catch (IOException e) {
            Panic.panic(e);
        }
        return buf.array()[0] == status;
    }

    public boolean isActive(long xid) {
        // 都会检查是否为超级事务
        if(xid == SUPER_XID) return false;
        return checkXID(xid, FIELD_TRAN_ACTIVE);
    }

    public boolean isCommitted(long xid) {
        if(xid == SUPER_XID) return true;
        return checkXID(xid, FIELD_TRAN_COMMITTED);
    }

    public boolean isAborted(long xid) {
        if(xid == SUPER_XID) return false;
        return checkXID(xid, FIELD_TRAN_ABORTED);
    }

    public void close() {
        try {
            fc.close();
            file.close();
        } catch (IOException e) {
            Panic.panic(e);
        }
    }

}

```
## 总结

TM模块主要用于**管理事务，包括开始、提交、回滚事务**，以及检查事务的状态。在类中需要定义一些常量来管理事务如`LEN_XID_HEADER_LENGTH、XID_FIELD_SIZE、FIELD_TRAN_ACTIVE、FIELD_TRAN_COMMITTED、FIELD_TRAN_ABORTED、SUPER_XID和XID_SUFFIX`，分别表示XID文件头长度、每个事务的占用长度、事务的三种状态、超级事务、XID文件后缀。 还需定义一个`RandomAccessFile` 类型的`file`和一个`FileChannel`类型的`fc`，用于操作`XID`文件。还有一个`xidCounter`用于记录事务的数量，以及一个Lock类用于保证线程安全。然后会在构造函数中给file和fc赋值，然后调用`checkXIDCounter`方法检查`XID`文件是否合法。 `**begin**`方法用于开始一个新的事务，`**commit**`方法用于提交事务，`**abort**`方法用于回滚事务。这三个方法内部都会调用`**updateXID**`方法，将事务ID和事务状态写入到XID文件中。`**begin**`还会调用另外一个`**incrXIDCounter**`方法，用于将XID +1并更新XID Header。 `isActive、isCommitted`和`isAborted`方法用于检查事务是否处于活动、已提交或已回滚状态。这三个方法内部都会调用checkXID方法，检查XID文件中的事务状态是否与给定的状态相等；close方法用于关闭文件通道和文件。
# Data Manager（DM）
上层模块和文件系统之间的一个抽象层

职能:
- 向下直接读写文件
- 向上提供数据的包装DataItem
- 日志功能
无论是向上还是向下，DM 都提供了一个缓存的功能，用内存操作来保证效率。

内存淘汰算法的选择：
- LRU
LRU 在缓存满时自动驱逐最少使用的数据，可能导致上层模块无法强制将关键数据刷回数据源，造成数据一致性问题。
如何放到缓存，如果此时缓存满了，又会驱逐新的资源，造成缓存抖动。
当然可以添加额外信息解决，比如添加最后修改时间，和驱逐时间
```
- **记录最后修改时间**：每次资源被修改时，记录其最后修改时间。
- **记录驱逐时间**：当资源被驱逐出缓存时，记录其驱逐时间。
- **判断是否回源**：
    - 当上层模块需要强制将资源刷回数据源时，检查资源的最后修改时间和驱逐时间。
    - 如果最后修改时间早于驱逐时间，说明资源在驱逐前已经修改过，需要进行回源操作。
    - 如果最后修改时间晚于驱逐时间，说明资源在驱逐后未被修改，可以避免无效回源。
```


- 引用计数
问题的根源还是，LRU 策略中，资源驱逐不可控，上层模块无法感知。而引用计数策略正好解决了这个问题，只有上层模块主动释放引用，缓存在确保没有模块在使用这个资源了，才会去驱逐资源。

这就是引用计数法了。增加了一个方法 `release(key)`，用于在上册模块不使用某个资源时，释放对资源的引用。当引用归零时，缓存就会驱逐这个资源。

同样，在缓存满了之后，引用计数法无法自动释放缓存，此时应该直接报错（和 JVM 似的，直接 OOM）

## 如何实现DM
### #  引用计数缓存框架

首先定义一个`AbstractCache<T>`抽象类，定义两个抽象方法，留给实现类实现
```java
/**
 * 当资源不在缓存时的获取行为
 */
protected abstract T getForCache(long key) throws Exception;
/**
 * 当资源被驱逐时的写回行为
 */
protected abstract void releaseForCache(T obj);
```

1. `**private HashMap<Long, T> cache;**`：这是一个 **HashMap** 对象，用于存储实际缓存的数据。键是资源的唯一标识符（通常是资源的ID或哈希值），值是缓存的资源对象（类型为 **T**）。在这个缓存框架中，**cache** 承担了普通缓存功能，即存储实际的资源数据。
    
2. `**private HashMap<Long, Integer> references;**`：这是另一个 **HashMap** 对象，用于记录每个资源的引用个数。键是资源的唯一标识符，值是一个整数，表示该资源当前的引用计数。引用计数表示有多少个模块或线程正在使用特定的资源。通过跟踪引用计数，可以确定何时可以安全地释放资源。
    
3. `**private HashMap<Long, Boolean> getting;**`：这是第三个 **HashMap** 对象，用于记录哪些资源当前正在从**数据源**获取中。键是资源的唯一标识符，值是一个布尔值，表示该资源是否正在被获取中。在多线程环境下，当某个线程尝试从数据源获取资源时，需要标记该资源正在被获取，以避免其他线程重复获取相同的资源。这个 **getting** 映射用于处理多线程场景下的并发访问问题。


方法梗概,既然是缓存框架，肯定有获得缓存的内容，释放缓存，还有安全关闭缓存
- `protected T get(long key)`获取指定id的资源，进入一个轮询状态，尝试从缓存获取，首先判断缓存中是否有线程正在从磁盘中获取，如果有则sleep一段时间重新获取，(如果直接获取会导致会导致**重复读取**耗费io资源，因为多个线程读取都会写到同一个key；**数据不一致**，多个线程可能获取到不同版本的资源，导致数据不一致)。确保该资源没有其他线程从磁盘读取后，判断缓存是否存在，如果存在直接返回，不存在从磁盘读取。
- `protected void release(long key)`释放指定资源，如果引用为0，写回磁盘，否则，ref-1.
- `protected void close()`关闭缓存，写回所有资源到缓存。
###  数据页的缓存与管理
缓存单项结构：
```java
public class PageImpl implements Page {  
	private int pageNumber;  // 该页的页号
	private byte[] data;  // 实际数据
	private boolean dirty;  // 是否为脏数据
	private Lock lock;  // 页锁
	  
	private PageCache pc; // 缓存页的操作接口
}
```
PageCache定义了Page的一些操作:
```java
    public static final int PAGE_SIZE = 1 << 13;

    int newPage(byte[] initData);
    Page getPage(int pgno) throws Exception;
    void close();
    void release(Page page);

    void truncateByBgno(int maxPgno);
    int getPageNumber();
    void flushPage(Page pg);
```

- [x] 暂停缓存页的相关操作 ✅ 2024-07-28

### 数据页管理
第一页不用来存储数据，用来启动检查，原理：每次启动在100-107字节随机生成。如果数据库正常关闭，这些字节会拷贝到108-115。如是数据库启动时都会判断两处字节是否对应，如果不一致说明上次异常关闭，需要执行数据恢复流程。
