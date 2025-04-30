---
title: 项目设计
tags:
  - redis
  - 项目实战
mathjax: true
cover: 'https://img.loliapi.cn/i/pc/img231.webp'
categories: redis
abbrlink: 61760
---

# 系统架构

![image-20240502173535759](https://pic.zjcspace.xyz/img/202405031110216.png)

# 短信登录

## **基本流程：**

![https://pic.zjcspace.xyz/img/202405031250969.svg](https://pic.zjcspace.xyz/img/202405031250969.svg)

## 方式1.基于session登录:

### 发送验证码

![https://pic.zjcspace.xyz/img/202405031317124.svg](https://pic.zjcspace.xyz/img/202405031317124.svg)

关键代码:

```java
   @Override
    public Result sendCode(String phone, HttpSession session) {
        //验证手机号格式
        if (RegexUtils.isPhoneInvalid(phone)) {
            return Result.fail("手机号格式不正确");
        }
        //生成验证码
        String code = VeriyCodeGenerate.generate();
        session.setAttribute("code",code);
        return Result.ok("验证码已发送，注意查收😊");
    }
```



### 登录/注册

![https://pic.zjcspace.xyz/img/202405031417621.svg](https://pic.zjcspace.xyz/img/202405031417621.svg)

关键代码:
```java
    @Override
    public Result login(LoginFormDTO loginForm, HttpSession session) {
        String phone = loginForm.getPhone();
        String code = loginForm.getCode();
        // 验证手机格式
        if (RegexUtils.isPhoneInvalid(phone)) {
            return Result.fail(MessageContants.PHONEINVAILD);
        }
        // 验证验证码
        if (code==null||!code.equals(session.getAttribute("code"))) {
            return Result.fail(MessageContants.VERIYCODEERR);
        }
        // 验证是否注册
        User user = query().eq("phone",phone).one();

        if(user == null){ //手机号仅有一个
            String nickName = SystemConstants.PREFIX_NICKNAME + RandomUtil.randomString(9);
            user = new User().setPhone(phone).setNickName(nickName);
            save(user);
        }
        // 保存会话信息，维持登录状态
        // 保存必要即可，减小内存，保护隐私
        session.setAttribute("user", BeanUtil.copyProperties(user, UserDTO.class));
        return Result.ok();
    }
```



### 登录校验

**登录校验的解耦**

登录成功后会保存User信息到session，今后当访问某些需要前端校验的页面或接口时需要校验登录状态，如果我们为每一个接口都重复写相同的校验逻辑，未免太麻烦了，同时随着业务size的扩大，维护起来也相当不变，我们有两种方案，一种是Aop切片，在特定方法调用校验逻辑，另一种是添加拦截器，使用拦截器对某些接口来进行校验登录，符合则放行，不符合直接返回。

> 拦截器和过滤器有什么区别?


　　**①拦截器是基于java的反射机制的，而过滤器是基于函数回调。  
　　②拦截器不依赖与servlet容器，过滤器依赖与servlet容器。  
　　③拦截器只能对action请求起作用，而过滤器则可以对几乎所有的请求起作用。  
　　④拦截器可以访问action上下文、值栈里的对象，而过滤器不能访问。  
　　⑤在action的生命周期中，拦截器可以多次被调用，而过滤器只能在容器初始化时被调用一次。**

　　**⑥拦截器可以获取IOC容器中的各个bean，而过滤器就不行，这点很重要，在拦截器里注入一个service，可以调用业务逻辑。**

　
- 创建拦截器

	```java
	public class LoginInceptor implements HandlerInterceptor {
	    @Override
	    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
	        Object userDTO = request.getSession().getAttribute("user");
	        if(userDTO==null){
	            response.setStatus(403);
	            return false;
	        }
	        UserHolder.saveUser((UserDTO) userDTO);
	        return true;
	    }
	
	    @Override
	    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
	        UserHolder.removeUser();
	    }
	}
	
	```

- 添加拦截器到Spring MVC的拦截器链中

	```java
	@Configuration
	public class InceptorConfig implements WebMvcConfigurer {
	    @Override
	    public void addInterceptors(InterceptorRegistry registry) {
	        registry.addInterceptor(new LoginInceptor()).excludePathPatterns(
	                "/shop/**",
	                "/voucher/**",
	                "/shop-type/**",
	                "/upload/**",
	                "/blog/hot",
	                "/user/code",
	                "/user/login"
	        );
	    }
	}
	```

### 发现bug

我发现以上登录过程有漏洞！

假设我输入了手机号`p1`然后收到了验证码，我正确的收入了验证码然后此时我再修改`p1`为`p2`这时我会登录成功到`p2`的账户，解决方法是使用手机号作为key而不是`code`，并且加入验证手机号的逻辑：

改正如下:

```java
    @Resource
    private UserMapper userMapper;
    @Override
    public Result sendCode(String phone, HttpSession session) {
        //验证手机号格式
        if (RegexUtils.isPhoneInvalid(phone)) {
            return Result.fail(MessageContants.PHONEINVAILD);
        }
        //生成验证码
        String code = VeriyCodeGenerate.generate();
//        session.setAttribute("code",code); 错误
        session.setAttribute(phone,code);
        System.out.println(code);
        return Result.ok(MessageContants.VERIYCODEOK);
    }
```

其他不用改。

### 接入阿里云短信服务

>  待开发...

### session的局限性

面对集群方案时，session在tomcat服务器之间不共享，难以进行负载均衡。即使tomcat具有复制其他tomcat的功能，但难免造成内存浪费和数据一致性问题。因此面对集群时其替代方案必须满足：

- 数据共享--数据一致
- `key-value`的数据结构--方便
- 内存存储--快速

使用**redis**

## 方式2.使用redis

在前面的基础上，我们需要确定一下问题:

- **验证码在redis中的数据结构和相关问题**

	使用`string`的数据结构,与session不同redis是线程共享的，因此使用`"code"`作为`key`是万万不行的,这样无法区分用户，因此可以采用`phone`作为key。我们可以设置5min的存活时长。

	

- **登录信息在redis中的数据结构**

	- 使用`string`
		- **优点**：**简单**易懂，直观，**支持事务操作：** 对String类型的数据可以支持事务操作，保证原子性。**支持事务操作**
		- 缺点：存储了不必要的`{}""`，**占用空间大**，**无法改变单个字段**。
	- 使用`hash`（本项目实践）
		- **优点**：存储空间小，可以进行单个字段更改。
		- **缺点**：**不支持事务操作**

	

### 发送验证码

~~~java
这部分较为简单，使用`phone:veriyCode`存储:
```java
    @Override
    public Result sendCode(String phone, HttpSession session) {
        //验证手机号格式
        if (RegexUtils.isPhoneInvalid(phone)) {
            return Result.fail(MessageContants.PHONEINVAILD);
        }
        //生成验证码
        String code = VeriyCodeGenerate.generate();
        // 保存到redis
        stringRedisTemplate.opsForValue().set(RedisConstants.LOGIN_CODE_KEY+phone,code,2, TimeUnit.MINUTES);
        System.out.println(code);
        return Result.ok(MessageContants.VERIYCODEOK);
    }
```
~~~


​	

### 注册/登录

```java
    @Override
    public Result login(LoginFormDTO loginForm, HttpSession session) {
        String phone = loginForm.getPhone();
        String code = loginForm.getCode();
        // 验证手机格式
        if (RegexUtils.isPhoneInvalid(phone)) {
            return Result.fail(MessageContants.PHONEINVAILD);
        }
        // 验证验证码
        if (code==null||!code.equals(stringRedisTemplate.opsForValue().get(RedisConstants.LOGIN_CODE_KEY+phone))) {
            return Result.fail(MessageContants.VERIYCODEERR);
        }
        // 验证是否注册
        User user = query().eq("phone",phone).one();

        if(user == null){ //手机号仅有一个
            String nickName = SystemConstants.PREFIX_NICKNAME + RandomUtil.randomString(9);
            user = new User().setPhone(phone).setNickName(nickName);
            save(user);
        }
        // 保存用户信息
        //生成Token
        String token = UUID.randomUUID().toString(false);
        //存储用户信息
        UserDTO userDTO = BeanUtil.copyProperties(user,UserDTO.class);
        Map<String, Object> userDaoMap = BeanUtil.beanToMap(userDTO, new HashMap<>(),CopyOptions.create()
                .setIgnoreNullValue(true)
                .setFieldValueEditor((k,v)->{
                    return v.toString();
                }));
        stringRedisTemplate.opsForHash().putAll(RedisConstants.LOGIN_USER_KEY+token,userDaoMap);
        stringRedisTemplate.expire(RedisConstants.LOGIN_USER_KEY+token,RedisConstants.LOGIN_USER_TTL,TimeUnit.MINUTES);
        return Result.ok(token);
    }
```

### 后续身份校验

除此之外还有需要配置身份校验的拦截器。

这里我遇到了一个注入的问题，拦截器`LoginInceptor`注入`stringRedisTemplate`对象一开始我使用`@Resourse`这种注解使用，结果报空指针，然后我又加了`@Compent`注解让spring维护这个bean结果还是不行，后来发现`LoginInceptor`类的实是在`InceptorConfig`配置类中创建的，而该类由spring管理，因此我们可以把`stringRedisTemplate`放到配置类注入，需要在拦截器类额外添加一个带参构造方法。

基于session的方案改为redis的方案我们还需要一个用于token刷新的拦截器，此拦截器拦截所有路径，判定是否为已登录状态，如果是，则刷新token的expire时间。因此第一个拦截器负责刷新token和存入用户信息。第二个则根据ThreadLocal是否存在UserDto对象来进行特定api的校验。

**Q：为什么把redis的读写操作移到请求更多的第一层(方案2)？**

如果第一层仅仅用来刷新token，第二层进行user的获取和校验(方案1)

- 方案1每次普通redis请求次数：

	- 第一层：刷新token，写入token存活时间=1
	- 第二层：0
- 方案1权限请求，

	- 第一层：刷新token，写入token存活时间=1
	- 第二层：获取token对应userDTO=1
- 方案2普通请求

	- 第一层：刷新token，获得user对象，存入=2
	- 第二层：0
- 方案2权限请求
	- 第一层刷新token，获得user对象=2
	- 第二层：0

可以发现实际上现在方案的redis的**压力**更大，如果两种类型请求为1:1做法，后者是前者请求的1.3倍.但是前者会**重新**进行token的校验验证的相关逻辑,会增加服务器的压力，孰轻孰重应视情况而定。我暂时选第二种。

拦截器

```java
// 完成token刷新，根据token保存user对象。
public class VeriyUserInceptor implements HandlerInterceptor {
    StringRedisTemplate stringRedisTemplate;
    public VeriyUserInceptor(StringRedisTemplate stringRedisTemplate){
        this.stringRedisTemplate=stringRedisTemplate;
    }
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 获得token
        String token = request.getHeader("authorization");
        // 判断token是否为空
        if(token==null||token.equals("")){
            return true;
        }
        // 拼接token_key
        String token_key = RedisConstants.LOGIN_USER_KEY+token;
        // 获取用户信息
        Map<Object, Object> map = stringRedisTemplate.opsForHash().entries(token_key);
        // 判断是否该用户存在
        if(map.isEmpty()){
            return true;
        }
        UserDTO userDTO = BeanUtil.fillBeanWithMap(map,new UserDTO(),false);
        // 存储
        UserHolder.saveUser(userDTO);
        // 刷新有效期
        stringRedisTemplate.expire(token_key,RedisConstants.LOGIN_USER_TTL, TimeUnit.MINUTES);
        return true;
    }
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        UserHolder.removeUser();
    }
}


```



```java

// 进行身份校验，未登录的用户在特定页面和接口会返回403
@Slf4j
public class LoginInceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 上一个拦截器已经对已经
        if(UserHolder.getUser()==null){
            response.setStatus(403);
            return false;
        }
        return true;
    }
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        UserHolder.removeUser();
    }
}
```

拦截器配置类：

如果链式调用没有order()方法则默认按照添加顺序，否则order越小，优先级越大。

```java
@Configuration
public class InceptorConfig implements WebMvcConfigurer {
    @Resource
    StringRedisTemplate stringRedisTemplate;
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new VeriyUserInceptor(stringRedisTemplate)).addPathPatterns("/**");
        registry.addInterceptor(new LoginInceptor()).excludePathPatterns(
                "/shop/**",
                "/voucher/**",
                "/shop-type/**",
                "/upload/**",
                "/blog/hot",
                "/user/code",
                "/user/login"
        );
    }
}
```



# 为商户查询添加缓存

## 什么是缓存

缓存是原始意义是指访问速度比一般[随机存取存储器](https://zh.wikipedia.org/wiki/隨機存取記憶體)（RAM）快的一种RAM，可以理解为比内存还快的内存，用于解决cpu直接从内存读取较慢的问题，可以把访问频率高的数据存储到缓存中，cpu可以因避免io过长从而大大提高cpu的执行速度。

而如今缓存的概念已经泛化，不仅在CPU和主内存之间有Cache，而且在内存和[硬盘](https://zh.wikipedia.org/wiki/硬盘)之间也有Cache（**[磁盘缓存](https://zh.wikipedia.org/wiki/磁盘缓存)**），乃至在硬盘与[网络](https://zh.wikipedia.org/wiki/网络)之间也有某种意义上的Cache──称为**[Internet](https://zh.wikipedia.org/wiki/Internet)临时文件夹**或**网络内容缓存**等。**凡是位于速度相差较大的两种[硬件](https://zh.wikipedia.org/wiki/硬件)之间，用于协调两者数据传输速度差异的结构，均可称之为Cache。**

## 添加缓存

为商户添加

```java
    @Override
    public Result queryShopById(Long id) {
        //在redis查找
        String shopJson = stringRedisTemplate.opsForValue().get(CACHE_SHOP_KEY + id);
        //存在直接返回
        if(shopJson!=null){
            Shop shop = JSONUtil.toBean(shopJson, Shop.class);
            return Result.ok(shop);
        }
        //不存在查数据库
        Shop shop = getById(id);
        //数据库不存在，返回不存在
        if(shop==null){
            return Result.fail("商户不存在");
        }
        //数据库存在回写redis并且返回
        stringRedisTemplate.opsForValue().set(CACHE_SHOP_KEY+id,JSONUtil.toJsonStr(shop));
        return Result.ok();
    }
```
为商户类型添加:
```java
   @Override
    public Result queryTypeList() {
        // redis查询
        List<String> list = stringRedisTemplate.opsForList().range(CACHE_SHOP_TYPE_KEY, 0, -1);
        // 命中直接返回
        List<ShopType> l;
        if (list != null && !list.isEmpty()) {
            l = new ArrayList<>();
            list.forEach((i) -> {
                l.add(JSONUtil.toBean(i, ShopType.class));
            });
            l.sort(new Comparator<ShopType>() {
                @Override
                public int compare(ShopType shopType, ShopType t1) {
                    return shopType.getSort() - t1.getSort();
                }
            });
            return Result.ok(l);
        }
        // 未命中，查数据库
        l = query().orderByAsc("sort").list();
        // 不存在报错
        if(l==null){
            Result.fail("无类型😪");
        }
        // 存在回写redis并返回
        stringRedisTemplate.opsForList().leftPushAll(SHOP_GEO_KEY,JSONUtil.toJsonStr(l));
        return Result.ok(l);
    }
```

> 后来我知道了`JSONUtil.toList(l,ShopType.class);`这个方法😑

## 缓存更新策略

### 更新策略

|          | 内存淘汰                                         | 超时剔除                              | 主动更新                     |
| -------- | -------------------------------------------- | --------------------------------- | ------------------------ |
| **说明**   | 不同自已维护，利用Redis的内存清除机制，一旦内存不足时自动淘汰部分数据，下次查询缓存 | 给缓存数据设置TTL时间，到期后自动删除缓存。下次查询时更新缓存。 | 编写业务逻辑，在修改数据数据库的同时，更新缓存。 |
| **一致性**  | 差                                            | 一般                                | 好                        |
| **维护成本** | 无                                            | 低                                 | 高                        |

业务场景：

- 低一致性需求：使用内存淘汰机制。例如店铺类型的查询缓存
- 高一致性需求：主动更新，并以超时剔除作为兜底方案。例如在线商铺的查询缓存。

### 主动更新策略的三种模式

[参考][https://www.cnblogs.com/wftop1/p/17337665.html#%E7%BC%BA%E9%99%B7]

- (**Cache Aside Pattern**)由缓存调用者，在更新db时同时更新数据。
- (**Read/write Through Pattern**)缓存与db整合为一个服务，由服务本身进行数据一致性的维护，调用者调用该服务，其内部的数据一致性问题对调用者透明。
- (**Write Behind Caching Pattern**)调用者只操作缓存，db由其他线程异步写入。

第二种方案，市面上难找，开发难度大，第三种方案效率虽高，写多次redis只需一次同步到db，但风险较大，因redis基于内存，遇到redis宕机服务器宕机会导致数据丢失。因此采用较为稳妥的方案1；

**Cache Aside Pattern需要注意的问题:**

- 发生更新时如何更新
	- 更新缓存。更新数据库时更新缓存。无效写redis较多。
	-  删除缓存。更新数据库，并且使缓存失效。等待下次查询时，自动添加缓存。这是最佳实践。
	
- 如何保证缓存和数据库操作的原子性
	使用事务操作
	
- 先操作缓存还是先操作数据库？
	
	![image-20240505211537453](https://pic.zjcspace.xyz/b/202405052116004.png)
	
	

- 先删除缓存，可能造成数据不一致的原因是，一次更新操作，首先删除缓存，与此同时另一个线程查询缓存未命中，然后查询数据库的旧数据，并且回写缓存导致，缓存存放的旧数据
- 先操作数据库，可能造成数据库不一致的原因是，查询线程查询缓存未命中，继续查询数据库，在其回写缓存期间，另一线程进行了数据库更新并删除缓存，此时为空，删了个寂寞，而后查询线程回写了数据库的旧数据。

~~两种策略都会导致数据不一致问题，但概览不一样，前者的操作间隙较小，期间插入一个数据库的查询操作可能性较小。而后者，先操作数据库导致操作空隙较大，此时其他线程乘虚而入的几率会大大增加，因此采用**第一种方案。**~~

两种策略都会导致数据不一致但是概率不同，$前者删除的操作间隙=t_{db更新完成}-t_{缓存删除完成}=t_{db更新时间}$,$后者的操作间隙=t_{写入缓存}-t_{db查询完成}=t_{缓存写入时间}$

前者的操作间隙远远大于后者，且后者条件更为苛刻(需要缓存失效)。因此先操作数据库再操作缓存方为上策。

延迟删除?

Cache Aside 策略适合读多写少的场景，不适合写多的场景，因为当写入比较频繁时，缓存中的数据会被频繁地清理，这样会对缓存的命中率有一些影响。如果业务对缓存命中率有严格的要求，那么可以考虑两种解决方案：

  ●一种做法是在更新数据时也更新缓存，只是在更新缓存前先加一个分布式锁。因为这样在同一时间只允许一个线程更新缓存，就不会产生并发问题了。当然这么做对于写入的性能会有一些影响；

  ●另一种做法同样也是在更新数据时更新缓存，只是给缓存加一个较短的过期时间。这样即使出现缓存不一致的情况，缓存的数据也会很快过期，对业务的影响也是可以接受。

对于先更新数据库再删除缓存的极限似乎已经到这里了，我们也看看先删除缓存会怎么办？这时延时双删就出现了，针对「先删除缓存，再更新数据库」方案在「读 + 写」并发请求而造成缓存不一致的解决办法是「延迟双删」。

伪代码

```java
// 删除缓存
redis.delKey(X)
// 更新数据库
db.update(X)
// 睡眠
Thread.sleep(N)
// 再删除缓存
redis.delKey(X)
```

他在更新数据库后会添加一小段时间让线程休眠，之后删除缓存，来删除在数据库未更新完成期间期间，其他线程缓存的脏数据。

针对于前面的介绍，可以分析出以下结论：

  ●延时双删适用于对数据一致性要求较高的场景。它能够保证在数据库更新期间，读取请求不会读取到已经失效的缓存数据，从而保证数据的一致性。但是它需要进行两次缓存删除操作，可能会增加一定的资源开销;

  ●先更新数据库后删除缓存适用于对一致性要求较低，对性能要求较高的场景。它能够减少一次缓存删除的开销，但是在数据库更新期间，读取请求可能会读取到已经失效的缓存数据，从而导致数据不一致。

同时，还可以根据实际情况做一些权衡和优化。比如可以使用读写锁来减少数据库更新期间的并发读取请求，从而降低数据不一致的可能性。或者可以考虑使用更高效的缓存淘汰算法，来降低缓存的过期时间，减少缓存失效的影响。

| 方案          | 优点                        | 缺点                       | 实现难度 | 适用场景                           |
| ----------- | ------------------------- | ------------------------ | ---- | ------------------------------ |
| 先更新缓存后更新数据库 | 减少了一次缓存删除的开销              | 在数据库更新期间，可能读取脏数据         | 中等   | 适用于一致性要求较低、对性能要求较高的场景          |
| 先更新数据库再更新缓存 | 保证了数据一致性，读取时几乎不会读取失效的缓存数据 | 需要删除并再次缓存删除操作，增加了一定的资源开销 | 高    | 适用于一致性要求较高的场景，同时对性能或响应一定有弹性的场景 |

我们采用先更新数据库再删除缓存的策略，并通过给缓存设置有效时间来，缓解数据不一致性带来的问题。

查询缓存添加缓存时设置有效时间:

```java
        // 存在回写redis，设置有效时间并返回
        // 转字符串List<String>
        List<String> shopCache = l.stream().map(JSONUtil::toJsonStr).collect(Collectors.toList());
        stringRedisTemplate.opsForList().leftPushAll(CACHE_SHOP_TYPE_KEY, shopCache );
        stringRedisTemplate.expire(CACHE_SHOP_TYPE_KEY,CACHE_SHOP_TYPE_TTL, TimeUnit.MINUTES);
```

```java
        //数据库存在回写redis，设置有效时间并且返回
        stringRedisTemplate.opsForValue().set(CACHE_SHOP_KEY+id,JSONUtil.toJsonStr(shop),CACHE_SHOP_TTL, TimeUnit.MINUTES);
```

更新先写数据库再删除缓存

```java
    @Override
    @Transactional
    public Result updateShop(Shop shop) {
        if(shop.getId()==null){
            return Result.fail("店铺id不能为空🤗");
        }
        // 更新数据库
        updateById(shop);
        // 删除缓存
        stringRedisTemplate.delete(CACHE_SHOP_KEY+shop.getId());
        return Result.ok();
    }
```
## 缓存穿透问题

用户访问的数据，**既不在缓存中，也不在数据库中**，导致请求在访问缓存时，发现缓存缺失，再去访问数据库时，发现数据库中也没有要访问的数据，没办法构建缓存数据，来服务后续的请求。那么当有大量这样的请求到来时，数据库的压力骤增，这就是**缓存穿透**的问题。

### 解决方案

- 缓存空值

	当请求查询数据库发现不存在时，会根据该请求缓存一个空值，下次被请求时将不会打到数据库，但会产生数据不一致问题和内存占用高问题：缓存空值后，后续该缓存实际在数据库中有了数据，导致数据不一致，缓解方法是给缓存设置TLL过期时间，或者新增数据时主动为缓存覆盖空值。

- 使用布隆过滤器[(来自小林coding)][https://xiaolincoding.com/redis/cluster/cache_problem.html#%E7%BC%93%E5%AD%98%E7%A9%BF%E9%80%8F]

	我们可以在写入数据库数据时，使用布隆过滤器做个标记，然后在用户请求到来时，业务线程确认缓存失效后，可以通过查询布隆过滤器快速判断数据是否存在，如果不存在，就不用通过查询数据库来判断数据是否存在。

	即使发生了缓存穿透，大量请求只会查询 Redis 和布隆过滤器，而不会查询数据库，保证了数据库能正常运行，Redis 自身也是支持布隆过滤器的。

	那问题来了，布隆过滤器是如何工作的呢？接下来，我介绍下。

	布隆过滤器由「初始值都为 0 的位图数组」和「 N 个哈希函数」两部分组成。当我们在写入数据库数据时，在布隆过滤器里做个标记，这样下次查询数据是否在数据库时，只需要查询布隆过滤器，如果查询到数据没有被标记，说明不在数据库中。

	布隆过滤器会通过 3 个操作完成标记：

	- 第一步，使用 N 个哈希函数分别对数据做哈希计算，得到 N 个哈希值；
	- 第二步，将第一步得到的 N 个哈希值对位图数组的长度取模，得到每个哈希值在位图数组的对应位置。
	- 第三步，将每个哈希值在位图数组的对应位置的值设置为 1；

	举个例子，假设有一个位图数组长度为 8，哈希函数 3 个的布隆过滤器。

	![图片](https://cdn.xiaolincoding.com//mysql/other/86b0046c2622b2c4bda697f9bc0f5b28.png)

	在数据库写入数据 x 后，把数据 x 标记在布隆过滤器时，数据 x 会被 3 个哈希函数分别计算出 3 个哈希值，然后在对这 3 个哈希值对 8 取模，假设取模的结果为 1、4、6，然后把位图数组的第 1、4、6 位置的值设置为 1。**当应用要查询数据 x 是否数据库时，通过布隆过滤器只要查到位图数组的第 1、4、6 位置的值是否全为 1，只要有一个为 0，就认为数据 x 不在数据库中**。

	布隆过滤器由于是基于哈希函数实现查找的，高效查找的同时**存在哈希冲突的可能性**，比如数据 x 和数据 y 可能都落在第 1、4、6 位置，而事实上，可能数据库中并不存在数据 y，存在误判的情况。

	所以，**查询布隆过滤器说数据存在，并不一定证明数据库中存在这个数据，但是查询到数据不存在，数据库中一定就不存在这个数据**。

### 采用布隆过滤器

​		我们采用布隆过滤器来完成.由于是在项目已经积累了一定数据的情况下进行布隆过滤器的添加，因此我们需要进行预热处理，把所要进行过滤业务的key全部从数据库遍历并缓存到布隆过滤器。对于其局限性：无法正确检测在运行过程中已经删除的数据，这没什么大事，毕竟数量相对较少，可以允许它打进数据库。

注册bean:

```java
    @Bean("bloomFilter")
    public RBloomFilter<String> getFilter(){
        Config config = new Config();
        String redisUrl = String.format("redis://%s:%d", redisHost, redisPort);
        config.useSingleServer().setAddress(redisUrl)
                .setDatabase(redisDatabase)
                .setPassword(redisPassword);
        RedissonClient redissonClient = Redisson.create(config);
        RBloomFilter<String> bloomFilter = redissonClient.getBloomFilter("bloomFilter");
        bloomFilter.delete();
        bloomFilter = redissonClient.getBloomFilter("bloomFilter");
        return bloomFilter;
```



我们拿`Shop`来举例：

首先建立`BloomFilter`的预热机制：、

```java
@Slf4j
@Service
public class BloomFilterServiceImpl implements BloomFilterService {
    @Resource
    private Redisson redissonClient;
    @Resource
    private ShopTypeMapper shopTypeMapper;


    private void setupBloomFilter() {
        RBloomFilter<String> bloomFilter = redissonClient.getBloomFilter("bloomFilter");
        bloomFilter.tryInit(1000000L, 0.01);  // 初始化布隆过滤器，预计插入1000000元素，误判率为0.01
    }
    public boolean checkExists(String item) {
        RBloomFilter<String> bloomFilter = redissonClient.getBloomFilter("bloomFilter");
        return bloomFilter.contains(item);  // 检查元素是否存在于布隆过滤器中
    }

   @PostConstruct
    @Override
    public void initBloomFilter() {
        bloomFilter.delete();
        log.debug("预热布隆过滤器");
        setupBloomFilter();
        // 添加商户数据
        List<Shop> shopTypeIdList = shopMapper.selectList(new QueryWrapper<Shop>().select());
        shopTypeIdList.forEach((i)->{
            String bs_key = BLOOM_SHOP_KEY+i;
            if(!bloomFilter.contains(bs_key)){
                bloomFilter.add(bs_key);
            }
        });
    }
}

```

在需要添加shop的地方添加该key,由于该处并没有添加shop的接口故写伪代码：

```java
public Result addShop(ShopType shopType) {
    // 在添加数据后，添加到布隆过滤器
    bloomFilter.add(BLOOM_SHOP_KEY+shop.getId());
}
```

在查询商户的接口添加布隆过滤器的校验，不存在则返回；

```java
    @Override
    public Result queryShopById(Long id) {
		// 布隆过滤
        if(!bloomFilter.contains(BLOOM_SHOP_KEY+id)){
            return Result.fail("商户不存在");
        }
        // other code...
    }
```

## 缓存雪崩问题

缓存雪崩是指缓存中数据大批量到过期时间，而查询数据量巨大，请求直接落到数据库上，引起数据库压力过大甚至宕机。

常用的解决方案有：	

- 均匀过期

	设置不同的过期时间，让缓存失效的时间点尽量均匀。通常可以为有效期增加随机值或者统一规划有效期。





## 缓存击穿问题

缓存击穿，是指一个key非常热点，在不停的扛着大并发，大并发集中对这一个点进行访问，当这个key在失效的瞬间，持续的大并发就穿破缓存，直接请求数据库，就像在一个屏障上凿开了一个洞。

常用的解决方案有：	

- 使用互斥锁

	![缓存击穿-互斥锁.drawio](https://pic.zjcspace.xyz/b/202405141445277.svg)

	>
	>
	>**为什么不用java的Lock**?
	>
	>
	>
	>使用Java的 `Lock` 接口或其具体实现（如 `ReentrantLock`）确实是Java程序中常用的同步机制，用以控制多线程对共享资源的访问。然而，在涉及到分布式系统或者多个应用实例的环境中，Java的本地锁机制并不能直接使用，因为Java的锁仅限于同一个JVM内部的线程。这就是为什么在涉及到分布式缓存系统如Redis时，我们通常不使用Java的本地锁。

	```java
	    private Result queryWithMutex(Long id){
	        int MAX_RETRIES = 5;  // 最大重试次数，防止无限重试
	        String key = CACHE_SHOP_KEY + id;
	        String lock_key = LOCK_SHOP_KEY+id;
	        //在redis查找
	        String shopJson = stringRedisTemplate.opsForValue().get(key);
	        //存在直接返回
	        if(shopJson!=null){
	            Shop shop = JSONUtil.toBean(shopJson, Shop.class);
	            return Result.ok(shop);
	        }
	        // 未命中，获取互斥锁
	        for(int attempt=0;attempt<MAX_RETRIES;attempt++){
	            // 查询缓存
	            //在redis查找
	            shopJson = stringRedisTemplate.opsForValue().get(key);
	            //存在直接返回
	            if(shopJson!=null){
	                Shop shop = JSONUtil.toBean(shopJson, Shop.class);
	                return Result.ok(shop);
	            }
	            // 尝试获取锁
	            boolean lock = tryLock(lock_key);
	            // 获取锁，执行数据库查询以及回写缓存
	            if (lock){
	              try {
	                  Shop shop = getById(id);
	                  if (shop == null) {
	                      return Result.fail("商户不存在");
	                  }
	                  // 查询成功，回写缓存
	                  stringRedisTemplate.opsForValue().set(key, JSONUtil.toJsonStr(shop), CACHE_SHOP_TTL, TimeUnit.MINUTES);
	                  return Result.ok(shop);
	              } finally {
	                  releaseLock(lock_key);
	              }
	            }
	            else{
	                // 未获取，等待重试
	                try {
	                    Thread.sleep(100);
	                } catch (InterruptedException e){
	                    Thread.currentThread().interrupt();  // 重新设置中断状态
	                    log.debug("Interrupted during sleep on retry for lock: " + lock_key, e);
	                }
	            }
	        }
	        return Result.fail("服务器繁忙");
	    }
	    private boolean tryLock(String key){
	       return Boolean.TRUE.equals(stringRedisTemplate.opsForValue().setIfAbsent(key, "1", 1, TimeUnit.MINUTES));
	    }
	    private void releaseLock(String key){
	        stringRedisTemplate.delete(key);
	    }
	
	```
	
	自然语言描述：热点key失效，此时若干请求到来，发现缓存未命中，开始获取互斥锁，其中一个线程会获取到互斥锁后查询数据库并且回写缓存，成功后会释放锁，其他线程未获取锁，会一直尝试等待重试获取缓存，获取失败会尝试获取锁，超过尝试次数会返回失败信息。
	
- 逻辑过期

	流程图:|
	![缓存击穿_逻辑过期.drawio](https://pic.zjcspace.xyz/b/202405141447274.svg)

亟待解决的问题：逻辑过期问题的编码：

我们可以给存储的数据添加一个字段值存储创建时间，取出时，根据当前时间判断是否过期，继而执行下面逻辑。

在以往的业务中，我们往往将诸如Shop这种实体类直接储存到redis中，这导致我们无法存贮时间这种字段，有三种方法：

- 给Shop添加`expireTime`属性。

	这并不优雅，加入有上千个实体类，你都要添加吗，岂不是累死？并且降低了内聚性。

- 给Shop继承一个类，其带有`expireTime`属性。

	这并不优雅，我们还是需要硬编码原实体类。

- 专门封装一个`RedisData`类定义如下：

	```java
	@Data
	public class RedisData<T> {
	    private LocalDateTime expireTime;
	    private T data;
	}
	```

	这是优雅的，我们可以在编写业务时，把实体类放入`RedisData.data`中。对实体类并没有侵入。

​		完整实现:

```java
    private Result queryWithLogicExpire(Long id){
        // 查询缓存
        String shopJson = stringRedisTemplate.opsForValue().get(CACHE_SHOP_KEY + id);
        RedisData<Shop> redisData = new RedisData<>();
        // 查询成功
        if(shopJson!=null) {
            // 转换json->obj
            redisData = JSONUtil.toBean(shopJson, new TypeReference<RedisData<Shop>>() {
            }, true);

            // 判断是否过期
            LocalDateTime now = LocalDateTime.now();
            // 如果未过期则，直接返回
            if (now.isBefore(redisData.getExpireTime())) {
                return Result.ok(redisData.getData());
            }
        }
            // 如果过期,或者不存在
            // 尝试获取锁
            boolean lock = tryLock(LOCK_SHOP_KEY + id);
            //获取锁成功
            // 新建线程,查询数据库
            if (lock) {
                EXECUTOR_SERVICE.submit(()->{
                    try {
                        Shop shop = getById(id);
                        // 如果为空，释放锁返回
                        if(shop!=null){
                            saveData2Redis(shop,CACHE_SHOP_KEY+id, CACHE_SHOP_TTL);
                        }
                        // 回写缓存
                    }catch (Exception e){
                        log.error("更新商户缓存出错id:"+id,e);
                    } finally {
                        // 释放锁
                        releaseLock(LOCK_SHOP_KEY+id);
                    }
                });
                // 返回旧数据
                return Result.ok(redisData.getData());
            }
            // 获取锁失败
            // 非空直接返回旧数据
        if(redisData.getData()!=null){
            return Result.ok(redisData.getData());
        }
        return Result.fail("数据不存在");
    }
```

### 两种策略的优缺点应用场景


| 策略类型   | 优点                 | 缺点               | 应用场景                              |
| ------ | ------------------ | ---------------- | --------------------------------- |
| 互斥锁方法  | 强一致性；简单直接。         | 增加延迟；资源锁定；死锁风险。  | 对数据一致性要求高的场景，如金融交易；高频访问且更新不频繁的数据。 |
| 逻辑过期方法 | 降低延迟；后台更新；避免数据库压力。 | 数据一致性较低；实现复杂度较高。 | 对数据实时性要求不高，对响应时间有高要求的场景，如社交媒体内容。  |
|        |                    |                  |                                   |

# 秒杀

## 唯一id生成策略

优惠券使用时，需要订单的参与，而订单的id的设计需要保证全局唯一。传统自增id具有以下缺点：

- 隐私性差
- 不利于分库分表

应满足以下特性：

- 唯一性
- 高可用
- 高性能
- 安全性
- 递增性

有很多[方法](https://pdai.tech/md/arch/arch-z-id.html#%E4%BD%BF%E7%94%A8redis%E5%AE%9E%E7%8E%B0)

经过权衡采用`时间戳+序列号`的形式,42位表示时间戳，21位数表示序列号，可以使用年数:
$$
year = (2^{42}-nowTimeStamp())/1000/3600/12/365
$$
现在时间戳(2024.5.16)`1715852169165`代入

```java
        long maxTimestamp = (long) Math.pow(2, 42) - 1;
        long currentTimestamp = 1715852169165L;
        long remainingTimestamp = maxTimestamp - currentTimestamp;
        double millisecondsPerYear = 365.25 * 24 * 3600 * 1000;
        double remainingYears = remainingTimestamp / millisecondsPerYear;
        System.out.println("Remaining years: " + remainingYears);
```

得:

```
Remaining years: 84.99360984162294
```

如果是`41bit`结果是15年：

```
Remaining years: 15.310767814599336
```

但是拼接时间戳的初衷是提高安全性，让用户无法猜出我们的流水等信息，因此我们可以对时间戳进行再处理，我们可以假定一个时间`t0`时间戳`timestamp=now()-t0`这样隐蔽性会大大增加。

```java
@Component
public class RedisIdGenerator {
    @Resource
    private StringRedisTemplate stringRedisTemplate;
    // 2024.1.1:00:00:00
    private final Long  EPOCH = 1704067200L;
    private static final int BATCH_SIZE = 1000; // Batch size for pre-fetching IDs
    private long lastTimestamp = -1L;
    // 记录本地获取序列号。
    private final AtomicLong localSequence = new AtomicLong(0);
    // 记录本地获取序列号阈值
    private final AtomicLong localMaxSequence = new AtomicLong(0);
    private final long TIMESTAMP_BITS = 36L; // 时间戳位数，可使用2178年，一秒生成134,217,728个id
    private static final long SEQUENCE_BITS = 27L; // Bits for sequence number
    private static final long MAX_SEQUENCE = (1L << SEQUENCE_BITS) - 1; // Max sequence number: 2^27 - 1

    // 私有构造方法
    private RedisIdGenerator(){}
    public  Long generatorId(String keyPrefix){
        long now = Instant.now().getEpochSecond();
        long timestamp = now - EPOCH;

        // 时钟回拨
        if(timestamp<lastTimestamp){
            throw new RuntimeException("Clock moved backwards. Refusing to generate id");
        }

        // 获得预分配id
        long seq = localSequence.incrementAndGet();
        // 是否超出预分配id最大值?
        if(seq>localMaxSequence.get()){
            fetchBatchRedis(keyPrefix);
            seq = localSequence.incrementAndGet();
        }
        // 记录最近一次id
        lastTimestamp = timestamp;
        Long res = (timestamp<<TIMESTAMP_BITS)|(seq&MAX_SEQUENCE);
        System.out.printf("%d--%d--%d\n",timestamp,seq,res);

        return (timestamp<<TIMESTAMP_BITS)|(seq&MAX_SEQUENCE);
    }

    private void fetchBatchRedis(String keyPrefix){
        // 获取一定数量id
        Long increment = stringRedisTemplate.opsForValue().increment(keyPrefix, BATCH_SIZE);
        if(increment==null){
            throw new RuntimeException("Failed to fetch batch from Redis");
        }

        // 获取批量id的第一个
        localSequence.set(increment-BATCH_SIZE+1);
        localMaxSequence.set(increment);
    }
}


```

>9业务位数+41位时间戳秒+序列号12+异常位1=64位，这有可能出现负数?



### 添加优惠券

关键点就是全局id：

```java
    @Override
    public Result orderVoucher(Long voucherId) {
        // 获取优惠券信息
        SeckillVoucher seckillVoucher = seckillVoucherService.getById(voucherId);
        System.out.println(seckillVoucher);
        // 判空
        if(seckillVoucher==null) {
            return Result.fail("优惠券不存在");
        }
        // 判断时间是否合理
        LocalDateTime beginTime = seckillVoucher.getBeginTime();
        LocalDateTime endTime = seckillVoucher.getEndTime();
        LocalDateTime now = LocalDateTime.now();
        if(now.isBefore(beginTime)){
            return Result.fail("该优惠券活动未开始");
        }
        if(now.isAfter(endTime)){
            return Result.fail("该优惠券活动已经结束");
        }
        // 时间合理
        // 判断库存
        if(seckillVoucher.getStock()<=0){
            return Result.fail("库存不足");
        }
        // 保存订单
        // 获取用户id
        UserDTO user = UserHolder.getUser();
        // 创建订单
        VoucherOrder voucherOrder = new VoucherOrder();
        // 订单id
        voucherOrder.setId(redisIdGenerator.generatorId("id:order"));
        voucherOrder.setVoucherId(seckillVoucher.getVoucherId());
        voucherOrder.setUserId(user.getId());
        // 保存订单
        save(voucherOrder);
        return Result.ok(voucherOrder.getId());
    }
```

## 超卖问题

想象一下以下场景：某一优惠券再某一时刻被数以千计的的用户抢购，此时往往会出现销售数量>库存数量，也就是超卖现象。主要原因是在并发场景下，请求几乎同时到达，对库存资源进行竞争，由于没有适当的并发控制策略导致的错误。

解决方案有以下几种：

- 悲观锁

	**什么是悲观锁？**

	悲观锁总是假设最坏的情况，认为共享资源每次被访问的时候就会出现问题(比如共享数据被修改)，所以每次在获取资源操作的时候都会上锁，这样其他线程想拿到这个资源就会阻塞直到锁被上一个持有者释放。也就是说，**共享资源每次只给一个线程使用，其它线程阻塞，用完后再把资源转让给其它线程**。

	高并发的场景下，激烈的锁竞争会造成线程阻塞，大量阻塞线程会导致系统的上下文切换，增加系统的性能开销。并且，悲观锁还可能会存在死锁问题，影响代码的正常运行。

	

- 乐观锁

	**什么是乐观锁？**

	乐观锁总是假设最好的情况，认为共享资源每次被访问的时候不会出现问题，线程可以不停地执行，无需加锁也无需等待，只是在提交修改的时候去验证对应的资源（也就是数据）是否被其它线程修改了（具体方法可以使用版本号机制或 CAS 算法）。

	高并发的场景下，乐观锁相比悲观锁来说，不存在锁竞争造成线程阻塞，也不会有死锁的问题，在性能上往往会更胜一筹。但是，如果冲突频繁发生（写占比非常多的情况），会频繁失败和重试，这样同样会非常影响性能，导致 CPU 飙升。

	实现方法:

	- 版本号机制

		一般是在数据表中加上一个数据版本号 `version` 字段，表示数据被修改的次数。当数据被修改时，`version` 值会加一。当线程 A 要更新数据值时，在读取数据的同时也会读取 `version` 值，在提交更新时，若刚才读取到的 

	- CAS 算法

	CAS 的全称是 **Compare And Swap（比较与交换）** ，用于实现乐观锁，被广泛应用于各大框架中。CAS 的思想很简单，就是用一个预期值和要更新的变量值进行比较，两值相等才会进行更新。

	CAS 是一个原子操作，底层依赖于一条 CPU 的原子指令。

	> **原子操作** 即最小不可拆分的操作，也就是说操作一旦开始，就不能被打断，直到操作完成。

	CAS 涉及到三个操作数：

	- **V**：要更新的变量值(Var)
	- **E**：预期值(Expected)
	- **N**：拟写入的新值(New)

	当且仅当 V 的值等于 E 时，CAS 通过原子方式用新值 N 来更新 V 的值。如果不等，说明已经有其它线程更新了 V，则当前线程放弃更新。
		对于优惠券来说库存(stock)是一个天然的version，因此我们可以不用额外添加的字段来判断。
	
	```java
	    @Override
	    public Result orderVoucher(Long voucherId) {
	        // 获取优惠券信息
	        SeckillVoucher seckillVoucher = seckillVoucherService.getById(voucherId);
	        System.out.println(seckillVoucher);
	        // 判空
	        if(seckillVoucher==null) {
	            return Result.fail("优惠券不存在");
	        }
	        // 判断时间是否合理
	        LocalDateTime beginTime = seckillVoucher.getBeginTime();
	        LocalDateTime endTime = seckillVoucher.getEndTime();
	        LocalDateTime now = LocalDateTime.now();
	        if(now.isBefore(beginTime)){
	            return Result.fail("该优惠券活动未开始");
	        }
	        if(now.isAfter(endTime)){
	            return Result.fail("该优惠券活动已经结束");
	        }
	        // 时间合理
	        // 判断库存
	        int stock = seckillVoucher.getStock();
	        if(stock<=0){
	            return Result.fail("库存不足");
	        }
	        // 保存订单
	        // 获取用户id
	        UserDTO user = UserHolder.getUser();
	        // 创建订单
	        VoucherOrder voucherOrder = new VoucherOrder();
	        // 订单id
	        voucherOrder.setId(redisIdGenerator.generatorId("id:order"));
	        voucherOrder.setVoucherId(seckillVoucher.getVoucherId());
	        voucherOrder.setUserId(user.getId());
	        // 减少库存
	        // 乐观锁，判断预期，是否合理
	        boolean succ = seckillVoucherService.update().setSql("stock=stock-1")
	                .eq("stock", stock).eq("voucher_id", seckillVoucher.getVoucherId()).update();
	        if(!succ){
	            return Result.fail("服务器繁忙，请重试...");
	        }
	        // 保存订单
	        save(voucherOrder);
	        return Result.ok(voucherOrder.getId());
	    }
	```
	
	使用stock来检测在查询库存和更新库存期间，有无其他线程修改库存，通过在更新库存时判断stock和查询stock时的数值是否一致，达到version的方法实现乐观锁。
	
	使用jemeter压测10000请求抢夺10000库存结果如下:
	
	![image-20240518211804980](https://pic.zjcspace.xyz/b/202405182118154.png)
	
	可以发现异常率高达`92.93%`，库存预期为`0`，实际为`9293`。这样出错率太高了。有没有什么办法补救。
	
	我们分析以下10000线程请求的时候发生了什么，
	
	1.各个线程查询了库存，判断库存是否足够。。
	
	2.更新库存。
	
	在1和2之间数据库中的库存可能被其他线程已经修改。由于线程越多，几率越大，而修改必然导致会导致update失败从而导致抢购失败。
	
	解决方法就是细化锁，放宽条件，我们把
	
	```java
	        boolean succ = seckillVoucherService.update().setSql("stock=stock-1")
	                .eq("stock", stock).eq("voucher_id", seckillVoucher.getVoucherId()).update();
	```
	
	改为
	
	```java
	        boolean succ = seckillVoucherService.update().setSql("stock=stock-1")
	                .gt("stock", 0).eq("voucher_id", seckillVoucher.getVoucherId()).update();
	```
	
	以前是库存不等即加锁，现在是库存<=0才加锁。再次测试：
	![image-20240519141842953](https://pic.zjcspace.xyz/b/202405191418853.png)
	
	错误率大大降低，但是为什么还是有错误？想象以下场景，假设此时库存为1，许多线程查询库存为1于是开始更新操作，在此更新期间已经有某一线程，成功完成了所有操作，把库存改为0，于是这些线程就失败了。。可以分析，此方案出错往往发生在库存告急之时，而上一个方案，错误随时发生。这确实不错🥰。

## 一人一单

在优惠券的抢购过程中，我们总是希望每一个用户只能使用一次，而不是订购多次，因此我们要求每一个用户对于每个优惠券只能生成一个订单。如何实现呢?

一个自然的想法是，在每次创建订单时，判断本次创建的`user_id`和`voucher_id`是否存在于订单表中，如果存在则提示错误，不存在才允许创建。这会带来数据库压力骤增，其次是，这真的可以保证一人一单吗？

使用此方法伪代码如下:

```java
other code...
// 判断是否已经订购
boolean exist = queryUserIdAndVoucherIdExists(userId,voucherId);
if(exist==true){
	return error;
}
subStock(voucherId);
addOrder(userId,voucherId)；
other code...
```

可以发现当多个同一用户的线程同时执行

```java
boolean exist = queryUserIdAndVoucherIdExists(userId,voucherId);
```

时，因为数据库对读操作并没有加锁。因此多个线程同时读到相同的结果，然后他们都进行了创建订单的操作，此次就会造成一人多单的局面。如何做呢?

- 迭代1：给整个方法加锁

	这种方案可以解决一人一单问题，但是性能太低，不同用户本不需要进行锁的争夺，这导致了请求的串行化，性能大大降低。

- 迭代2：锁住userId这个字符串

	针对迭代1中的串行化问题，我们可以更改锁对象为可以标识用户的对象，userId就是很好的标识，我们可以锁住`userId.toString().intern()`。这样当不同用户的线程执行时，此锁对他们透明，而相同用户的线程执行时，他们会竞争锁，串行执行。

- 迭代3:减少锁的临界区范围：

	临界区太大会导致更多的代码串行化，我们能否进行临界区的缩减以达到最优的性能。

	目前的代码长这样:
	```java
	    @Override
	    public Result orderVoucher(Long voucherId) {
	        synchronized (UserHolder.getUser().getId().toString().intern()) {
	            // 获取优惠券信息
	            // 判空
	            // 判断时间是否合理
	            // 时间合理
	            // 判断库存
	            // 保存订单
	            // 获取用户id
	            // 确保一人一单
	            // 创建订单
	            // 订单id
	            // 减少库存
	            // 乐观锁，判断预期，是否合理
	            // 保存订单
	            return Result.ok(voucherOrder.getId());
	        }
	    }
	```

	出现并发安全的地方在确保一人一单的逻辑，在这之前不必加锁，因为这并不涉及共享资源的修改或者即使修改也有后面的乐观锁处理，在"确保一人一单"后面的逻辑需要加锁，因为如果不加锁，由于时间片分配不均，垃圾回收等一些情况导致其他同一用户线程同时来进行订单的添加(此时的代码不是临界区，存在并发风险)，就会导致一人多单问题。因此最终的方案就是：
	```java
	    @Override
		@Transactional
	    public Result orderVoucher(Long voucherId) {
	       
	         // 获取优惠券信息
	         // 判空
	         // 判断时间是否合理
	         // 时间合理
	         // 判断库存
	         // 保存订单
	         // 获取用户id
	         synchronized (UserHolder.getUser().getId().toString().intern()) {
	            // 确保一人一单
	            // 创建订单
	            // 订单id
	            // 减少库存
	            // 乐观锁，判断预期，是否合理
	            // 保存订单
	            return Result.ok(voucherOrder.getId());
	        }
	    }
	```

- 迭代4:事务失效

	`@Transactional`注解整个方法运行完才会进行事务的提交，因此锁会先于事务提交释放，如果此间有其他线程运行到一人一单逻辑，仍然会查询到事务提交前的结果。解决办法是，抽出方法，在调用方外围添加锁。如下。

	```java
	    @Override
	    public Result orderVoucher(Long voucherId) {
	
	            // 获取优惠券信息
	            SeckillVoucher seckillVoucher = seckillVoucherService.getById(voucherId);
	            System.out.println(seckillVoucher);
	            // 判空
	            if (seckillVoucher == null) {
	                return Result.fail("优惠券不存在");
	            }
	            // 判断时间是否合理
	            LocalDateTime beginTime = seckillVoucher.getBeginTime();
	            LocalDateTime endTime = seckillVoucher.getEndTime();
	            LocalDateTime now = LocalDateTime.now();
	            if (now.isBefore(beginTime)) {
	                return Result.fail("该优惠券活动未开始");
	            }
	            if (now.isAfter(endTime)) {
	                return Result.fail("该优惠券活动已经结束");
	            }
	            // 时间合理
	            // 判断库存
	            int stock = seckillVoucher.getStock();
	            if (stock <= 0) {
	                return Result.fail("库存不足");
	            }
	            // 保存订单
	            synchronized (UserHolder.getUser().getId().toString().intern()) {
	                IVoucherOrderService proxy = (IVoucherOrderService) context.getBean(IVoucherOrderService.class);
	                return proxy.createVoucherOrder(seckillVoucher);
	            }
	    }
	
	    @Transactional
	    public Result createVoucherOrder(SeckillVoucher seckillVoucher) {
	        // 获取用户id
	        UserDTO user = UserHolder.getUser();
	
	        // 确保一人一单
	        int count = query().eq("voucher_id", seckillVoucher.getVoucherId())
	                .eq("user_id", user.getId()).count();
	        if (count > 0) {
	            return Result.fail("请勿重复购买");
	        }
	
	        // 创建订单
	        VoucherOrder voucherOrder = new VoucherOrder();
	        // 订单id
	        voucherOrder.setId(redisIdGenerator.generatorId("id:order"));
	        voucherOrder.setVoucherId(seckillVoucher.getVoucherId());
	        voucherOrder.setUserId(user.getId());
	        // 减少库存
	        // 乐观锁，判断预期，是否合理
	        boolean succ = seckillVoucherService.update().setSql("stock=stock-1")
	                .ge("stock", 0).eq("voucher_id", seckillVoucher.getVoucherId()).update();
	        if (!succ) {
	            return Result.fail("服务器繁忙，请重试...");
	        }
	        // 保存订单
	        save(voucherOrder);
	        return Result.ok(voucherOrder.getId());
	    }
	```
###  集群模式下的并发控制
通过使用本地锁（如`synchronized`关键字或`ReentrantLock`类），可以有效地解决单个应用程序实例下的多线程并发问题。这种锁机制是基于JVM的监视器（Monitor）模式，其作用范围限定在单个JVM实例中。然而，在集群环境下，应用可能被部署在多个服务器上，此时相同用户的并发请求可能被分配到不同的服务器实例上处理。在这种情况下，单个JVM内的锁无法跨服务器实例进行线程同步和并发控制。

因此，为了保证在分布式系统中的数据一致性和线程安全，我们需要采用分布式锁。分布式锁不受单个JVM的限制，它能够跨多个服务器实例协调和管理访问共享资源的线程。这样的锁通常依赖于网络资源或持久化存储（如Redis、Zookeeper等），提供一种机制以确保不同服务器实例上的操作能够在并发环境下安全执行。使用分布式锁是解决多服务器部署下并发控制问题的关键技术策略。

### 分布式锁
采用redis来进行分布式锁的构建。较为普遍的方案是采用redis中的SETNX命令来实现。
其命名格式：
```bash
SETNX key value
```
为了因服务器宕机等因素造成的死锁，还应设计每个key的TTL，设置key和设置ttl应该作为一个事务，具有原子性。
根据此构建锁:
```java
public class SimpleRedisLock implements RedisLock{
    @Override
    public boolean tryLock(StringRedisTemplate stringRedisTemplate, String name, Long ttlSec) {
        String PREFIX = "lock:";
        return Boolean.TRUE.equals(stringRedisTemplate.opsForValue().setIfAbsent(PREFIX+name, "1", ttlSec, TimeUnit.SECONDS));
    }

    @Override
    public void release(StringRedisTemplate stringRedisTemplate, String name) {
        String PREFIX = "lock:";
        stringRedisTemplate.delete(PREFIX+name);
    }
}
```

#### 进一步迭代
即便采用上述方案，仍然存在潜在的并发问题。设想这样一种情况：线程A成功获取了锁并开始执行业务逻辑。在它释放锁之前，JVM启动了全面垃圾收集（Full GC）。这个过程中，如果锁的有效期间意外过期并被自动释放，此时线程B检测到锁已释放，随即获取锁并开始业务处理。若此时线程A所在的JVM完成Full GC并恢复执行，它会尝试释放已经被线程B占有的锁。这会导致线程A错误地删除了线程B当前持有的锁。假设随后线程C也来获取并持有了锁，这将导致线程B和C并发执行，从而增加了数据一致性风险和系统的不稳定性。
应该怎么做呢？
当前的分布式锁方案是使用setnx命令，使用业务名作为key来唯一确定每一个jvm中做相同业务的线程，为避免误删锁，我们可以在删除锁时判断当前锁是否还是原来的锁，我们可以利用value来做文章，使用value来存储，创建该锁的线程的唯一标识。可以使用[[source/_posts/java/浅析几种唯一id生成算法#UUID|uuid]]+thread_id的办法:来唯一标识线程。
```java
public class SimpleRedisLock implements RedisLock{
    private static final String UUID_PART = UUID.randomUUID().toString(true);
    private final String KEY_PREFIX = "lock:";
    @Override
    public boolean tryLock(StringRedisTemplate stringRedisTemplate, String name, Long ttlSec) {
        // 拼接key
        String key = KEY_PREFIX+name;
        // 拼接val
        String id = UUID_PART+Thread.currentThread().getId();
        return Boolean.TRUE.equals(stringRedisTemplate.opsForValue().setIfAbsent(KEY_PREFIX+name,id,
                ttlSec, TimeUnit.SECONDS));
    }

    @Override
    public void release(StringRedisTemplate stringRedisTemplate, String name) {
        // 拼接key
        String key = KEY_PREFIX+name;
        if(!Objects.equals(stringRedisTemplate.opsForValue().get(key), UUID_PART + Thread.currentThread().getId())){
            return;
        }
        stringRedisTemplate.delete(key);
    }
}
```
这里有一些细节:UUID使用`static`来修饰，这保证了同一jvm内的UUID相同，不同jvm的uuid不同，具体jvm由threadid来区分。

#### 进两步迭代
事情到此好像已经完美了，实际上仍然存在问题。设想以下场景，线程a获取了锁，完整了执行了业务，释放锁时，也正确判断了该锁为自己的锁，正当它执行删除锁的操作时，jvm又进行了fullGC,以至于锁过期，此时来自其他jvm的线程b到来，获取到了锁，在线程b执行业务过程中，线程a停止阻塞，继续执行删除锁的操作，此时又会发生误删除b线程的锁，此时线程c到来获得了锁，bc线程又产生了并发风险。。。
其问题在于判断与删除的原子性问题，这两种操作应该是原子的要不一起执行，要么都不执行。保证两者的原子性最常见的方法就是使用Lua脚本来封装这两个操作。

```lua
-- 当前key  
local key = KEYS[1]  
-- 当前传入线程标识id  
local val = AVGS[1]  
  
-- 锁的实际id  
local ac_id = redis.call("get",key)  
  
if(val==ac_id) then  
redis.call("del",key)  
end  
  
return 0;
```

 调用:
 ```java
    
    private static final DefaultRedisScript<Long> REDIS_SCRIPT;
    static {
        REDIS_SCRIPT = new DefaultRedisScript<>();
        REDIS_SCRIPT.setLocation(new ClassPathResource("unlock.lua"));
    }
	@Override
    public void release(StringRedisTemplate stringRedisTemplate, String name) {
        // 拼接key
        String key = KEY_PREFIX+name;
        stringRedisTemplate.execute(REDIS_SCRIPT, List.of(key), UUID_PART+Thread.currentThread().getId());
//        if(!Objects.equals(stringRedisTemplate.opsForValue().get(key), UUID_PART + Thread.currentThread().getId())){
//            return;
//        }
//        stringRedisTemplate.delete(key);
    }
}
```
### 进三步迭代
即使如此，当前的分布式锁还存在一系列问题：
- **不可重入**:同一线程无法获取同一把锁。
- **不可重试**：获取锁只尝试一次，没有重试机制，失败率高。
- **超时释放**：超市释放机机制虽然一定程度避免了死锁发生的概率，但是如果业务执行耗时过长，期间锁就释放了，这样存在安全隐患。锁的有效期过短，容易出现业务没执行完就被释放，锁的有效期过长，容易出现死锁，所以这是一个大难题！

想要手搓十分繁琐，故需要站在前人肩膀，只需要了解其思想即可。
使用Redission的lock。

## 使用Redission实现分布式锁

- 基于SETNX实现的分布式锁存在以下问题
    1. **重入问题**
        - 重入问题是指获取锁的线程，可以再次进入到相同的锁的代码块中，可重入锁的意义在于防止死锁，例如在HashTable这样的代码中，它的方法都是使用synchronized修饰的，加入它在一个方法内调用另一个方法，如果此时是不可重入的，那就死锁了。所以可重入锁的主要意义是防止死锁，我们的synchronized和Lock锁都是可重入的
    2. **不可重试**
        - 我们编写的分布式锁只能尝试一次，失败了就返回false，没有重试机制。但合理的情况应该是：当线程获取锁失败后，他应该能再次尝试获取锁
    3. **超时释放**
        - 我们在加锁的时候增加了TTL，这样我们可以防止死锁，但是如果卡顿(阻塞)时间太长，也会导致锁的释放。虽然我们采用Lua脚本来防止删锁的时候，误删别人的锁，但现在的新问题是没锁住，也有安全隐患
    4. **主从一致性**
        - 如果Redis提供了主从集群，那么当我们向集群写数据时，主机需要异步的将数据同步给从机，万一在同步之前，主机宕机了(主从同步存在延迟，虽然时间很短，但还是发生了)，那么又会出现死锁问题
- 那么什么是Redisson呢
    - Redisson是一个在Redis的基础上实现的Java驻内存数据网格(In-Memory Data Grid)。它不仅提供了一系列的分布式Java常用对象，还提供了许多分布式服务，其中就包含了各种分布式锁的实现
- Redis提供了分布式锁的多种多样功能
    1. 可重入锁(Reentrant Lock)
    2. 公平锁(Fair Lock)
    3. 联锁(MultiLock)
    4. 红锁(RedLock)
    5. 读写锁(ReadWriteLock)
    6. 信号量(Semaphore)
    7. 可过期性信号量(PermitExpirableSemaphore)
    8. 闭锁(CountDownLatch)
使用它来替换我们之前的锁:
```java
   @Override
    public Result orderVoucher(Long voucherId) throws InterruptedException {

            // 获取优惠券信息
            SeckillVoucher seckillVoucher = seckillVoucherService.getById(voucherId);
            System.out.println(seckillVoucher);
            // 判空
            if (seckillVoucher == null) {
                return Result.fail("优惠券不存在");
            }
            // 判断时间是否合理
            LocalDateTime beginTime = seckillVoucher.getBeginTime();
            LocalDateTime endTime = seckillVoucher.getEndTime();
            LocalDateTime now = LocalDateTime.now();
            if (now.isBefore(beginTime)) {
                return Result.fail("该优惠券活动未开始");
            }
            if (now.isAfter(endTime)) {
                return Result.fail("该优惠券活动已经结束");
            }
            // 时间合理
            // 判断库存
            int stock = seckillVoucher.getStock();
            if (stock <= 0) {
                return Result.fail("库存不足");
            }
            String lock_name = "voucherOrder:" + UserHolder.getUser().getId().toString().intern();
            // 保存订单
//            RedisLock redisLock = new SimpleRedisLock();
        RLock redisLock= redissonClient.getLock("lock:order:" + lock_name);
//        boolean lock = redisLock.tryLock(stringRedisTemplate, lock_name, 5L);
        boolean lock = redisLock.tryLock(2, 10, TimeUnit.MINUTES);
        if(!lock){
                return Result.fail("请勿重复下单");
        }
        try {
            IVoucherOrderService proxy = (IVoucherOrderService) context.getBean(IVoucherOrderService.class);
            return proxy.createVoucherOrder(seckillVoucher);
        } finally {
            redisLock.unlock();
//          redisLock.release(stringRedisTemplate,lock_name);
        }
//            synchronized (lock) {
//                IVoucherOrderService proxy = (IVoucherOrderService) context.getBean(IVoucherOrderService.class);
//                return proxy.createVoucherOrder(seckillVoucher);
//            }
    }

    @Transactional
    public Result createVoucherOrder(SeckillVoucher seckillVoucher) {
        // 获取用户id
        UserDTO user = UserHolder.getUser();

        // 确保一人一单
        int count = query().eq("voucher_id", seckillVoucher.getVoucherId())
                .eq("user_id", user.getId()).count();
        if (count > 0) {
            return Result.fail("请勿重复购买");
        }

        // 创建订单
        VoucherOrder voucherOrder = new VoucherOrder();
        // 订单id
        voucherOrder.setId(redisIdGenerator.generatorId("id:order"));
        voucherOrder.setVoucherId(seckillVoucher.getVoucherId());
        voucherOrder.setUserId(user.getId());
        // 减少库存
        // 乐观锁，判断预期，是否合理
        boolean succ = seckillVoucherService.update().setSql("stock=stock-1")
                .ge("stock", 0).eq("voucher_id", seckillVoucher.getVoucherId()).update();
        if (!succ) {
            return Result.fail("服务器繁忙，请重试...");
        }
        // 保存订单
        save(voucherOrder);
        return Result.ok(voucherOrder.getId());
    }

```
Q：`            IVoucherOrderService proxy = (IVoucherOrderService) context.getBean(IVoucherOrderService.class);`是什么鬼?
A:
在Spring框架中，当一个类的方法被`@Transactional`注解修饰后，Spring会为该类创建一个代理（Proxy），这样在调用这些被注解方法时，Spring可以自动地处理事务的开始和结束等操作。这个过程是通过AOP（面向切面编程）来实现的。

在你的代码示例中，`createVoucherOrder`方法被`@Transactional`注解修饰，意味着这个方法在执行时，Spring将通过代理来控制事务。这就带来了一个特别的问题：在同一个类的内部调用被`@Transactional`注解的方法时，这种代理是不会起作用的。因为内部方法调用直接通过`this`引用发生，它不会经过Spring的代理，这就意味着事务的处理（例如新建事务或者加入现有事务）不会被自动处理。

为了解决这个问题，可以通过从Spring上下文（ApplicationContext）中显式获取该类的代理对象，然后通过这个代理对象来调用方法。这样，所有的事务管理逻辑，由Spring通过代理自动处理，都将正常工作。

所以在你的代码中：
```java
IVoucherOrderService proxy = (IVoucherOrderService) context.getBean(IVoucherOrderService.class);
return proxy.createVoucherOrder(seckillVoucher);

```

这段代码确保`createVoucherOrder`方法是通过它的代理对象调用的，从而确保`@Transactional`注解的事务处理逻辑被正确触发。这种做法主要用在需要确保事务处理正确进行的场景，特别是当你在一个事务方法中调用同一个类中的另一个事务方法时。


### 可重入实现原理
在探求Redisson的可重入原理之前，我们不妨看一下jdk中`java.util.concurrent.locks`的ReentrantLock是如何实现可重入的：
```java
        @ReservedStackAccess
        final boolean tryLock() {
            Thread current = Thread.currentThread();
            int c = this.getState();
            if (c == 0) {
                if (this.compareAndSetState(0, 1)) {
                    this.setExclusiveOwnerThread(current);
                    return true;
                }
            } else if (this.getExclusiveOwnerThread() == current) {
                ++c;
                if (c < 0) {
                    throw new Error("Maximum lock count exceeded");
                }

                this.setState(c);
                return true;
            }

            return false;
        }
```
可以看到其使用了`private volatile int state;`这个变量来维护锁的状态，当同一线程每次获取同一把锁，state就会+1，释放锁就会-1。当state=0时，代表该锁没有线程持有。

在回到Redisson我们发现其也是使用了相似的原理：
- 在分布式锁中，它采用hash结构来存储锁，其中外层key表示这把锁是否存在，内层filed则记录当前这把锁被哪个线程持有，value则代表该filed线程锁获取该锁的次数，当value=0时，表示没有线程，可以把锁删除。
大致流程如下：
![](https://pic.zjcspace.xyz/b/202406082029452.png)

### 可重试
![](https://pic.zjcspace.xyz/b/202407010842621.png)
### 超时释放
利用`watchDog`，每隔一段时间（releaseTime / 3），重置超时时间。
### 主从一致性
利用Redisson的`multiLock`，多个独立的Redis节点，必须在所有节点都获取重入锁，才算获取锁成功

在经典的主从模型中，负责写操作的是主节点，读操作是从节点。主从一致需要时间，因此可能引发下列问题：
- 某个应用请求尝试获取锁（向主节点发起写操作），并成功，此时主节点拥有该应用请求的锁。
- 主节点向从节点同步数据，此时主节点宕机，没有同步到从节点，与客户端连接断开。
- 哨兵检测到异常，主节点切换为另一个从节点。此时该应用执行业务。在此期间其他请求尝试获取锁，并成功。同样执行业务，导致了并发问题。
解决该问题的方案是把每一个从节点都视作从节点，应用获取锁需要同时向所有节点获取锁。都获取成功才能成功获取锁。

## 秒杀的优化
目前的架构是这样的：

![](https://pic.zjcspace.xyz/b/202407011044594.png)

我们可以发现其中大量模块进行了数据库的查找,我们可以把需要查询和修改的数据写到redis中,并使用Lua脚本做业务逻辑实现，而且他能确保原子性。


![](https://pic.zjcspace.xyz/b/202407011424370.png)

Lua脚本返回状态码来判断是否成功，主线程据此执行相应异步操作。
![[source/_posts/java/Pasted image 20240701143026.png]]
Lua脚本如下：
```lua

-- 优惠券id
local voucherId = ARGV[1]

-- userId
local userId = ARGV[2]


local stockKey = 'secKillVoucher:stock:'..voucherId
-- 判断是否过期：

if redis.call('get', stockKey)==nil then
    return 3;
end

-- 判断库存是否充足
if (tonumber(redis.call('get', stockKey))<=0 )then
    return 1
end

-- 判断用户是否下过单
local orderKey = 'secKillVoucher:order:'..voucherId
if (redis.call('sismember', orderKey, userId)==1) then
    return 2
end

-- 扣减库存
redis.call('incrby',stockKey,-1)

-- 添加用户
redis.call("sadd",orderKey,userId)

-- 创建成功

return 0
sudo yum install docker-ce-3:24.0.0-1.el8   docker-ce-cli-3:24.0.0-1.el8  containerd.io docker-buildx-plugin docker-compose-plugin
```

### 使用消息队列
使用rabbitMQ来进行异步消息的处理，涉及生产者确认和消费者确认：
```java
// 消费者

@RabbitListener
@Component
@Slf4j
public class OrderListener {
    @Resource
    private VoucherOrderServiceImpl voucherOrderService;


    @RabbitListener (bindings = @QueueBinding(
            value = @Queue(name = "order.queue"),
            exchange = @Exchange(name = "order.direct",type = ExchangeTypes.DIRECT),
            key = {
                    "voucherOrder",
            }
        )
    )
    public void createOrder(VoucherOrder voucherOrder){
        log.info("正在处理{}",voucherOrder);
        voucherOrderService.createVoucherOrder(voucherOrder);
        log.info("{}处理成功",voucherOrder);
    }
}

```

```java
// 生产者异常==RabbitConfig
  @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        RabbitTemplate rabbitTemplate = applicationContext.getBean(RabbitTemplate.class);
        rabbitTemplate.setReturnCallback(new RabbitTemplate.ReturnCallback() {
            @Override
            public void returnedMessage(Message message, int replyCode, String replyText, String exchange, String routingKey) {
                log.error("生产者消息发送失败:消息:{},状态码:{},原因:{},交换机:{},消息:{}",message,replyCode,replyText,exchange,routingKey);
            }
        });
    }
```


## 发布blog功能
上传图片
# 点赞功能
- 使用redis set结构存储每个shop 的Liked_user.
- ~~点赞数就是set的size~~点赞数从数据库中查找，未来可以点赞数是set_size,然后消息队列异步处理数据库操作。
- 当前用户是否点赞就是judge这个set有没有当前用户id.
- 在相关需要展示点赞的接口添加该逻辑。
# 点赞排行榜
- 使用可排序可去重的sortset.
- 需要修改之前的set逻辑，来适配
- 从redis获得的数据是有序的，但执行sql后查询的结果因为有in，所以是无序的，需要特殊处理。
# 关注
- 关注同时回写redis
- 共同关注取两者交集 

# feed
![](https://pic.zjcspace.xyz/b/202407032009339.png)
使用推模式，把redis的sortedlist做收件箱，根据score=timestamp来排序。滚动查询，标记查询的lastId；
key max min limit offset count

| key     | max         | min | offset           | count   |     |
| ------- | ----------- | --- | ---------------- | ------- | --- |
| set的key | lastId，前端传来 | 0   | 上一次的minScore.num | 返回数量，随意 |     |
# 附近商户
需要redis的geo，因此需要把商铺数据导入到redis中，当前架构需要：
- 添加商铺时，应该同时回写redis
- 把已经添加的商铺数据使用脚本redis.
redis的geo key`geo:shoptype:`
## 返回按geo排序
- 判断是否geo
- 取出shopType的所有shop,并根据距离升序
- 遍历获得ids和distanceMap
- 按照ids截取偏移量且遍历取得shop_list
- 把每个shop_list注入distance根据distanceMap.

# 签到

# 单节点reids存在的问题：
![](https://pic.zjcspace.xyz/b/202407141056951.png)
![](https://pic.zjcspace.xyz/b/202407141058416.png)
![](https://pic.zjcspace.xyz/b/202407141106530.png)
![](https://pic.zjcspace.xyz/b/202407141111622.png)
RDB方式bgsave的基本流程：
- 首先子进程会fork一个主数据的页表，每个页表项的指针指向单个数据。
- 在子进程生成RDB快照的过程中，主进程可能会继续处理写操作。由于采用了Copy-On-Write机制，写操作会导致被修改的内存页复制，因此主进程和子进程各自维护独立的数据副本，保证子进程快照的一致性。
缺点：
- **性能开销**：`fork()`操作会复制当前内存页表，子进程在写快照时会占用额外的内存。
- **数据丢失风险**：由于RDB是基于时间点的快照，可能会丢失快照生成后到下次生成前这段时间内的数据。
## AOF
![](https://pic.zjcspace.xyz/b/202407141125217.png)
![](https://pic.zjcspace.xyz/b/202407141126016.png)
![](https://pic.zjcspace.xyz/b/202407141131919.png)
![](https://pic.zjcspace.xyz/b/202407141135521.png)
![](https://pic.zjcspace.xyz/b/202407141135891.png)
# 主从同步
![](https://pic.zjcspace.xyz/b/202407141202047.png)
![](https://pic.zjcspace.xyz/b/202407141205120.png)
![](https://pic.zjcspace.xyz/b/202407141211965.png)
- 优化：
  ![](https://pic.zjcspace.xyz/b/202407141220597.png)
  ![](https://pic.zjcspace.xyz/b/202407141220877.png)
  ![](https://pic.zjcspace.xyz/b/202407141248718.png)
  ![](https://pic.zjcspace.xyz/b/202407141527566.png)
  ![](https://pic.zjcspace.xyz/b/202407141534053.png)
  ![](https://pic.zjcspace.xyz/b/202407141607055.png)
  ![](https://pic.zjcspace.xyz/b/202407142149208.png)
  ![](https://pic.zjcspace.xyz/b/202407142204774.png)
  ![](https://pic.zjcspace.xyz/b/202407142212501.png)
  ![](https://pic.zjcspace.xyz/b/202407142219513.png)
  ![](https://pic.zjcspace.xyz/b/202407142220119.png)
  ![](https://pic.zjcspace.xyz/b/202407142232238.png)
  ![](https://pic.zjcspace.xyz/b/202407150926218.png)
  ![](https://pic.zjcspace.xyz/b/202407150932803.png)
  ![](https://pic.zjcspace.xyz/b/202407150932134.png)
  ![](https://pic.zjcspace.xyz/b/202407150934996.png)
  ![](https://pic.zjcspace.xyz/b/202407150938752.png)
  ![](https://pic.zjcspace.xyz/b/202407150941054.png)
  ![](https://pic.zjcspace.xyz/b/202407150942091.png)
  ![](https://pic.zjcspace.xyz/b/202407151001391.png)
  ![](https://pic.zjcspace.xyz/b/202407151003575.png)
  ![](https://pic.zjcspace.xyz/b/202407151011996.png)
  ![](https://pic.zjcspace.xyz/b/202407151016891.png)
  ![](https://pic.zjcspace.xyz/b/202407151016507.png)
![](https://pic.zjcspace.xyz/b/202407151033810.png)

![](https://pic.zjcspace.xyz/b/202407151033528.png)
![](https://pic.zjcspace.xyz/b/202407151048730.png)
![](https://pic.zjcspace.xyz/b/202407151050395.png)
![](https://pic.zjcspace.xyz/b/202407151059768.png)![](https://pic.zjcspace.xyz/b/202407151100811.png)
![](https://pic.zjcspace.xyz/b/202407151104492.png)
![](https://pic.zjcspace.xyz/b/202407151106549.png)
![](https://pic.zjcspace.xyz/b/202407151117566.png)
![](https://pic.zjcspace.xyz/b/202407151127208.png)
![](https://pic.zjcspace.xyz/b/202407151134195.png)
![](https://pic.zjcspace.xyz/b/202407151141785.png)
![](https://pic.zjcspace.xyz/b/202407151145232.png)