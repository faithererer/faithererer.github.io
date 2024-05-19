---
title: 黑🐎点评
tags: [redis,项目实战]
mathjax: true
cover: https://steamuserimages-a.akamaihd.net/ugc/1709666070115424150/BC49D4781E37934E3E7AEE94662022A8FADBED19/
categories: redis
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

可以发现实际上现在方案的redis的**压力**更大，如果两种类型请求为1:1做法，后者是前者请求的1.3倍.但是前者会**重新**进行token的校验验证的相关逻辑,会增加服务器的压力，孰轻孰重应视情况而定。我暂时选第二种

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

|              | 内存淘汰                                                     | 超时剔除                                                     | 主动更新                                         |
| ------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------ |
| **说明**     | 不同自已维护，利用Redis的内存清除机制，一旦内存不足时自动淘汰部分数据，下次查询缓存 | 给缓存数据设置TTL时间，到期后自动删除缓存。下次查询时更新缓存。 | 编写业务逻辑，在修改数据数据库的同时，更新缓存。 |
| **一致性**   | 差                                                           | 一般                                                         | 好                                               |
| **维护成本** | 无                                                           | 低                                                           | 高                                               |

业务场景：

- 低一致性需求：使用内存淘汰机制。例如店铺类型的查询缓存
- 高一致性需求：主动更新，并以超时剔除作为兜底方案。例如在线商铺的查询缓存。

### 主动更新策略的三种模式

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

| 方案                   | 优点                                               | 缺点                                             | 实现难度 | 适用场景                                                     |
| ---------------------- | -------------------------------------------------- | ------------------------------------------------ | -------- | ------------------------------------------------------------ |
| 先更新缓存后更新数据库 | 减少了一次缓存删除的开销                           | 在数据库更新期间，可能读取脏数据                 | 中等     | 适用于一致性要求较低、对性能要求较高的场景                   |
| 先更新数据库再更新缓存 | 保证了数据一致性，读取时几乎不会读取失效的缓存数据 | 需要删除并再次缓存删除操作，增加了一定的资源开销 | 高       | 适用于一致性要求较高的场景，同时对性能或响应一定有弹性的场景 |

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
        // 查询成功
        if(shopJson!=null){
            // 转换json->obj
            RedisData<Shop> redisData = Convert.convert(new TypeReference<RedisData<Shop>>() {
            }, shopJson);
            // 判断是否过期
            LocalDateTime now = LocalDateTime.now();
            // 如果未过期则，直接返回
            if(now.isBefore(redisData.getExpireTime())){
                return Result.ok(redisData.getData());
            }
            // 如果过期
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
            // 直接返回旧数据
            return Result.ok(redisData.getData());
        }
        return Result.fail("数据不存在");
    }
    // 定义转换方法
    private <T> void saveData2Redis(T data,String key,Long TTL){
        RedisData<T> redisData = new RedisData<>();
        redisData.setData(data);
        redisData.setExpireTime(LocalDateTime.now().plusMinutes(TTL));
        // 存储到redis
        stringRedisTemplate.opsForValue().set(key,JSONUtil.toJsonStr(redisData));
    }
```

### 两种策略的优缺点应用场景


| 策略类型     | 优点                                 | 缺点                             | 应用场景                                                     |
| ------------ | ------------------------------------ | -------------------------------- | ------------------------------------------------------------ |
| 互斥锁方法   | 强一致性；简单直接。                 | 增加延迟；资源锁定；死锁风险。   | 对数据一致性要求高的场景，如金融交易；高频访问且更新不频繁的数据。 |
| 逻辑过期方法 | 降低延迟；后台更新；避免数据库压力。 | 数据一致性较低；实现复杂度较高。 | 对数据实时性要求不高，对响应时间有高要求的场景，如社交媒体内容。 |

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
    private final long TIMESTAMP_BITS = 32L; // 时间戳位数，可使用69年

    private final long MAX_SEQUENCE = 0xFFFFFFFFL; // 序列号到达2^32-1后置于0
    public Long generatorId(String keyPrefix){
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

