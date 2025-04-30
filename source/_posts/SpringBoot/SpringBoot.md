---
title: SpringBoot
tags:
  - SpringBoot
  - Vue
  - 全栈
  - 前端
  - 后端
  - java
mathjax: true
cover: 'https://vip1.loli.io/2022/05/12/Z746KJUiaulVYsj.jpg'
abbrlink: 33757
date: 2023-07-11 15:54:42
---

# maven

**本地仓库配置**：

`conf->settings.xml`里设置本地仓库存储路径

```xml
 <localRepository>/path/to/local/repo</localRepository>
```

并在IDEA设置中设置其主目录路径，配置文件路径和仓库路径。

## 控制器



# 热部署

java项目的修改需要重启项目，开发效率低很麻烦，可以进行热部署。

Spring Boot提供了**spring-boot-devtools**组件，使得无须手动重启SpringBoot应用即可重新编译、启动项目，大大缩短编译启动的时间。

devtools会监听classpath下的文件变动，触发Restart类加载器重新加载该类，从而实现类文件和属性文件的热部署。

并不是所有的更改都需要重启应用(如静态资源、视图模板)，可以通过设置spring.devtools.restart.exclude属性来指定一些文件或目录的修改不用重启应用。

- **引入spring-boot-devtools**：

    加入依赖   在`pom.xml`将以下标签加入到`				     <dependencies>ADD_IT</dependencies>`:
	
    ```xml
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-devtools</artifactId>
                <optional>true</optional>
            </dependency>
    ```

- 然后同步依赖，如果没有会下载。

- 在`application.properties`中配置`devtools`:

    ```properties
    # 热部署生效
    spring.devtools.restart.enabled=true
    # 监听目录
    spring.devtools.restart.additional-paths=src/main/java
    ```

- 在设置中找到`构建执行部署->编译器`勾选`自动构建项目`

- 在设置中找到`高级设置->编译器`勾选`即使开发的应用程序当前正在运行，也允许自动make启动`

# Controller

- Spring Boot将传统Web开发的mvc、json、tomcat等框架整合，提供了spring-boot-starter-web组件，简化了Web应用配置。
- 创建SpringBoot项目勾选Spring Web选项后，会自动将spring-boot-starter-web组件加入到项目中
- spring-boot-starter-web启动器主要包括web、webmvc、json、tomcat等基础依赖组件，作用是提供Web开发场景所需的所有底层依赖。
- webmvc为Web开发的基础框架，json为JSON数据解析组件，tomcat为自带的容器依赖。

```xml
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

![image-20230712102857157](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202307121029003.png)

**`@RestController`会将对象数据以`json`的形式返回**

```java
@RestController
public class Controller {
    @RequestMapping(value = "/hello",method = RequestMethod.GET)
    public String hello(){
        return sth;
    }
}
```

路由映射：

- RequestMapping注解主要负责URL的路由映射。它可以添加在Controller**类**或者具体的**方法**上。
- 如果添加在Controller类上，则这个Controller中的所有路由映射都将会映射规则，如果添加在方法上，则只对当前方法生效。
- @RequestMapping注解包含很多属性参数来定义HTTP的请求映射规则用的属性参数如下:
	- value:请求URL的路径，支持URL模板、正则表达式
	- method: HTTP请求方法
	- consumes:请求的媒体类型(Content-Type)，如application/jsonproduces:响应的媒体类型
	- headers:请求的参数及请求头的值



![image-20230730101858020](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202307301019158.png)

# 访问静态资源

使用IDEA创建Spring Boot项目，会默认创建出classpath:/static/目录，静态资源一般放在这个目录下即可。
如果默认的静态资源过滤策略不能满足开发需求，也可以自定义静态资源过滤策略。
在application.properties中直接定义过滤规则和静态资源位置:

```properties
spring.mvc.static-path-pattern=/static/**
spring.web.resources.static-locations=classpath:/static
```

# 文件上传

![image-20230712105412775](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202307121054747.png)

Spring Boot工程嵌入的tomcat限制了请求的文件大小，每个文件的配置最大为1Mb，单次请求的文件的总数不能大于10Mb。
要更改这个默认值需要在配置文件（如application.properties）中加入两个配置

```properties
spring.servlet.multipart.max-request-size=10MB
spring.servlet.multipart.max-file-size=10MB
```

一个文件上传的demo:

```java
@RestController
public class uploadController {
    @PostMapping("/upload")
    public String upload(String nickname, MultipartFile photo, HttpServletRequest httpServletRequest) throws IOException {
        // 打印一系列值
        System.out.println(nickname);
        System.out.println(photo.getOriginalFilename()+photo.getSize());
        System.out.println(photo.getContentType());
        //获取/upload目录的物理路径
        String path=httpServletRequest.getServletContext().getRealPath("/upload/");
        System.out.println(path);
        saveFile(photo,path);
        return "上传成功";
    }

    public void  saveFile(MultipartFile photo, String path) throws IOException {
        File dir= new File(path);
        if(!dir.exists()){
            dir.mkdir();
        }
        System.out.println(path);
        File file=new File(path+photo.getOriginalFilename());
        System.out.println(file.getPath());
        // 保存到指定文件
        photo.transferTo(file);
    }
}
```

## 拦截器

拦截器在Web系统中非常常见，对于某些全局统一的操作，我们可以把它提取到拦截器中实现。总结起来，拦截器大致有以下几种使用场景:

- **权限检查**:如登录检测，进入处理程序检测是否登录，如果没有，则直接返回登录页面。
- **性能监控**:有时系统在某段时间莫名其妙很慢，可以通过拦截器在进入处理程序之前记录开始时间，在处理完后记录结束时间，从而得到该请求的处理时
- **通用行为**:读取cookie得到用户信息并将用户对象放入请求，从而方便后续流程使用，还有提取Locale、Theme信息等，只要是多个处理程序都需要的，即可使用拦截器实现。

![image-20230712123537213](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202307121235074.png)

![image-20230712123743141](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202307121237054.png)

拦截器demo:

```java
public class LoginInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        System.out.println("LoginInterceptor");
        return true;
    }
}
```

配置类demo:

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new LoginInterceptor()).addPathPatterns("/test");
    }
}
```

# swagger

api接口文档

```xml
        <!--添加s wagger2相关功能 -->
        <dependency>
            <groupId>io.springfox</groupId>
            <artifactId>springfox-swagger2</artifactId>
            <version>2.9.2</version>
        </dependency>
        <!--添加swagger-ui相关功能-->
        <dependency>
            <groupId>io.springfox</groupId>
            <artifactId>springfox-swagger-ui</artifactId>
            <version>2.9.2</version>
        </dependency>
```

配置类：

```java

@Configuration//告诉Spring容器，这个类是一个配置类
@EnableSwagger2//启用Swagger2功能

public class Swagger2Config {
    @Bean
    public Docket createRestApi() {
        return new Docket(DocumentationType.SWAGGER_2)
                .apiInfo(apiInfo())
                .select()
                //com包下所有API都交给Swagger2管理
                .apis(RequestHandlerSelectors.basePackage("com"))
                .paths(PathSelectors.any()).build();
    }
    //API文档页面显示信息
    private ApiInfo apiInfo() {
        return new ApiInfoBuilder()
                .title("演示项目API")//标题
                .description("学习Swagger2的演示项目")//描述
                .build();
    }
}
```

mvc配置类:

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/swagger-ui.html")
                .addResourceLocations("classpath:/META-INF/resources/");
    }
}
```

# MybatisPlus

加入依赖:

```xml
<!-- MyBatisPlus依赖-->
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-boot-starter</artifactId>
    <version>3.4.2</version>
</dependency>
<!-- mysq1驱动依赖-->
<dependency>
	<groupId>mysql</groupId>
	<artifactId>mysql-connector-java</artifactId>
    <version>5.1.47</version>
</dependency>
<!--数据连接池druid-->
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>druid-spring-boot-starter</artifactId>
    <version>1.1.20</version>
</dependency>

```

配置:

```properties
# 数据库配置
# 数据库连接池技术
spring.datasource.type=com.alibaba.druid.pool.DruidDataSource
# 数据库驱动
spring.datasource.driver-class-name=com.mysql.jdbc.Driver
# 数据库地址
spring.datasource.url=jdbc:mysql://localhost:3306/qq?useSSL=false
# 账号密码
spring.datasource.username=root
spring.datasource.password=111111
# 日志输出格式
mybatis-plus.configuration.log-impl=org.apache.ibatis.logging.stdout.StdOutImpl
```

在主启动类添加注解

```java
@MapperScan("com/example/first_demo/Mapper")
```



在mapper接口实现查询数据

```java
@Mapper
public interface qqMapper {

    @Select("SELECT * FROM qq WHERE qq=3417759874")
    List<User> Select();
}

```

在Controller调用

```java
@RestController
public class qqController {
    @Autowired
    private qqMapper qqMapper;

    @GetMapping("/user")
    public List<User> find(){
        List<User> list=qqMapper.Select();
        System.out.println();
        return list;
    }
}


```

- CURD操作数据库

```java
@Mapper
public interface userMapper {
    @Insert("insert into user va1ues(#{id} , #{username} ,#{password} ,#{birthday})")
    int add(User user);
    @Update("update user set username=#{username } , password=#{password} ,birthday=#{birthday} where id=#{id]")
    int update(User user);
    @Delete("delete from user where id=#{id}")
    int delete(int id);
    @sel1ect( "select * from user where id=#{id}")User findById(int id);
    @select("select * from user")List<User> getAll();
}

```

- 特性，在plus版本上述也可省略:他会自动寻找，**前提是实体和表名一致**

	```
	@Mapper
	public interface qqMapper extends BaseMapper<User> {
	
	}
	
	
	
	```

## 多表联查

| 注解     | 功能                                  |
| -------- | ------------------------------------- |
| @Insert  | 实现插入                              |
| @Update  | 实现更新                              |
| @Delete  | 实现删除                              |
| @Select  | 实现查询                              |
| @Result  | 实现结果集封装                        |
| @Results | 可以与@Result一起使用，封装多个结果集 |
| @one     | 实现一对一结果集封装                  |
| @Many    | 实现一对多结果集封装                  |





















# Vue

demo1

```js
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>

<div id="app">
    {{ message }}
    <p v-html=link></p>
    <button v-on:click="addC">{{count}}</button>
    <img :src=img alt="">
    <p v-if="flag">出现</p>
    <p v-if=!flag>消失</p> 
    <ul>
        <li v-for="u in user_List" :key="u.id">{{u.name}},{{u.age}}</li>
    </ul>
    <ul>
        <li v-for="(u,i) in user_List" :key="u.id">{{u.name}},{{u.age}},{{i}}</li>
    </ul>    
</div>

<script>
  const { createApp } = Vue
  
  createApp({
    data() {
      return {
        message: 'Hello Vue!',
        img:'./107702902_p0_master1200.jpg'  
        user_List:[
            {"name":"张三","age":18},
            {"name":"李四","age":19},
            {"name":"王五","age":20}
         ]
      }
        methods: {
            addC(){
                this.count++
                this.flag=!this.flag
            },
            
        }        
    }
  }).mount('#app')
</script>
```

- `v-html`会渲染html标签

- `:属性`用于给html标签的属性赋值，原型是`v-bind:属性`

- `v-on:click`是Vue对`button`标签封装的用于监听事件的新属性，可以简写为`@click`

- `v-if`用于标签的取舍`v-if=true`保留，否则取消，同样的还有`v-else-if`,`v-else`,一个 `v-else` 元素必须跟在一个 `v-if` 或者 `v-else-if` 元素后面，否则它将不会被识别。

- ``v-for` 是 Vue.js 框架中的一个指令，用于在模板中循环渲染列表数据。使用 `v-for`，您可以遍历一个数组或对象，并为每个元素或属性生成对应的 HTML 元素或组件。可使用`u in user_List`和`(u,i) in user_List`两种风格来遍历。需要注意的是，为了优化渲染性能，每个循环项都应该有一个唯一的 `key` 属性。这可以帮助 Vue.js 更好地跟踪和更新列表中的元素。

- `v-model`页面<--->属性，`:value`页面<---属性,需要给列表加`key`否则在列表的元素状态不会绑定

```js
  <div id="app">
          <ul>
            <li v-for="u in user_List" :key="u.id"><input type="checkbox"> {{u.name}},{{u.age}}</li>
        </ul>
        <ul>
            <li v-for="(u,i) in user_List" :key="u.id"><input type="checkbox">{{u.name}},{{u.age}},{{i}}</li>
        </ul>
  </div>
  <script>
        const { createApp } = Vue
        createApp({
            data(){
                return {
                    message: 'Hello Vuzze!',
                    img:'107702902_p0_master1200.jpg',
                    count: 0,
                    flag: true,
                    link: '<a href="https://www.baidu.com">链接</a>',
                    user_List:[
                        {"name":"张三",id:1},
                        {"name":"李四",id:2},
                        {"name":"王五",id:3}
                    ],
                    nextId:4
                }
            },
            methods: {
                addC(){
                    this.count++
                    this.flag=!this.flag
                },
                addUser(){
                    this.user_List.unshift({"name":this.name,"age":this.age})
                    this.nextId++
                    this.name=''
                }
            
            }
 
        }).mount('#app')
    </script>
```

## npm安装

![image-20230713173436881](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202307131734863.png)

安装指令:

```shell
npm init vue@latest
```

这一指令将会安装并执行 [create-vue](https://github.com/vuejs/create-vue)，它是 Vue 官方的项目脚手架工具。你将会看到一些诸如 TypeScript 和测试支持之类的可选功能提示：

## 使用流程

- 在`./components`创建自己的组件`my.vue`
- 将`my.vue`导入到`App.vue`
- `npm run dev`

## 组件间的传值



组件可以由内部的Data提供数据，也可以由父组件通过`prop`的方式传值。兄弟组件之间可以通过`Vuex`等统─数据源提供数据共享。

在`App.vue`和`my.vue`传值：

- 在`App.vue`导入

	```js
	<script setup>
	import myy from './components/my.vue'
	</script>
	
	```

- 注册

	```js
	<script>
	  export default {
	    name: 'App',
	    components: {
	      HelloWorld,
	      TheWelcome,
	      myy
	    },
	    data() {
	      return {
	        msg: '爱来自App.vue'
	      }
	    }
	  }
	</script>
	```

	现在在`App.vue`中可以使用`my.vue`

- 在`my.vue`添加

	```js
	    export default {
	        name: 'my',
	        props:['title'],
	    }
	```

	即可在`App.vue`导入后作为属性使用

	```js
	      <myy titlse="哈哈哈" ccc="大大"> </myy>
	```

	



# ElementUi

- 安装

	```shell
	npm install element-plus --save
	```

- 导入`main.js`

	```js
	import ElementPlus from 'element-plus'
	import 'element-plus/dist/index.css'
	```

- 使用in`main.js`

	```js
	const app = createApp(App)
	
	app.use(ElementPlus)
	
	app.mount('#app') //一定要放最后挂载
	```

	

- 导入样例(以表格为例):

	- 找到源码,放入`Table.vue`
	- 在`App.vue`导入，引用，注册，正常显示

# axios

在实际项目开发中，前端页面所需要的数据往往需要从服务器端获取，这必然涉及与服务器的通信。
Axios是一个基于promise 网络请求库，作用于node.js和浏览器中。
Axios在浏览器端使用XMLHttpRequests发送网络请求，并能自动完成JSON数据的转换。

##  安装和使用

```shell
npm install axios
```

- 导入`main.js`

	```js
	import axios from 'axios'
	```

## 用法

- GET请求

	```js
	// 为给定 ID 的 user 创建请求
	axios.get('/user?ID=12345')
	  .then(function (response) {
	    console.log(response);
	  })
	  .catch(function (error) {
	    console.log(error);
	  });
	
	// 上面的请求也可以这样做
	axios.get('/user', {
	    params: {
	      ID: 12345
	    }
	  })
	  .then(function (response) {
	    console.log(response);
	  })
	  .catch(function (error) {
	    console.log(error);
	  });
	```

- POST请求

	```js
	axios.post('/user', {
	    firstName: 'Fred',
	    lastName: 'Flintstone'
	  })
	  .then(function (response) {
	    console.log(response);
	  })
	  .catch(function (error) {
	    console.log(error);
	  });
	```

	

**生命周期**:Vue.js 是一个基于组件的前端框架，它有一套生命周期钩子函数，**用于在组件的不同阶段执行特定的代码**。这些生命周期钩子函数允许您	在组件创建、更新和销毁的不同时间点执行自定义逻辑。

1. `beforeCreate`：在实例初始化之后、数据观测 (data observation) 和事件配置 (event/watcher setup) 之前被调用。在这个阶段，组件实例还没有被创建，因此无法访问到组件的数据和方法。
2. `created`：在实例创建完成后被调用。在这个阶段，组件实例已经创建，可以访问到组件的数据和方法。通常在这个阶段进行一些初始化操作，如获取数据、订阅事件等。
3. `beforeMount`：在组件挂载到 DOM 之前被调用。在这个阶段，模板已经编译完成，但尚未将组件渲染到页面上。
4. `mounted`：在组件挂载到 DOM 后被调用。在这个阶段，组件已经被渲染到页面上，可以进行 DOM 操作、发送请求等。通常在这个阶段进行一些需要操作 DOM 的初始化工作。
5. `beforeUpdate`：在组件更新之前被调用，即在数据发生变化导致组件重新渲染之前。在这个阶段，可以对组件的数据进行修改或进行一些准备工作。
6. `updated`：在组件更新完成后被调用。在这个阶段，组件已经完成数据的更新和重新渲染。
7. `beforeUnmount`：在组件销毁之前被调用。在这个阶段，组件实例仍然可用，可以进行一些清理工作，如取消订阅、清除定时器等。
8. `unmounted`：在组件销毁后被调用。在这个阶段，组件实例已经被销毁，无法再访问到组件的数据和方法。

### 请求

在create阶段进行数据请求:

```js
    created() {
      console.log('App.vue created')
      axios.get('http://localhost:8080/user').then(function (response){
        console.log(response)
      })
    },
```

此时请求会出现跨域请求（CROS）阻截

>为了保证浏览器的安全，不同源的客户端脚本在没有明确授权的情况下，不能读写对方资源，称为同源策略，同源策略是浏览器安全的基石
>同源策略(Sameoriginpolicy)是一种约定，它是浏览器最核心也最基本的安全功能
>所谓同源（即指在同一个域）就是两个页面具有相同的协议(protocol)，主机(host)和端口号(port)
>**当一个请求url的协议、域名、端口三者之间任意一个与当前页面url不同即为跨域**，**此时无法读取非同源网页的Cookie，无法向非同源地址发送AJAX请求**

### 解决

CORS (Cross-Origin Resource Sharing）是由W3C制定的一种跨域资源共享技术标准，其目的就是为了解决前端的跨域请求。

CORS可以在不破坏即有规则的情况下，通过后端服务器实现CORS接口，从而实现跨域通信。

CORS将请求分为两类:简单请求和非简单请求，分别对跨域通信提供了支持。

- 简单请求

	请求方法:GET、POST、HEAD
	除了以下的请求头字段之外，没有自定义的请求头:
	Accept、Accept-Language、Content-Language、Last-Event-ID、Content-Type
	Content-Type的值只有以下三种:
	text/plain、multipart/form-data、application/x-www-form-urlencoded

	- 处理

		对于简单请求，CORS的策略是请求时在请求头中增加一个Origin字段，

		```
		Host: localhost :8080
		Origin: http://localhost:8081
		Referer: http://localhost:8081/index.html
		```

		服务器收到请求后，根据该字段判断是否允许该请求访问，如果允许，则在HTTP头信息中添加Access-Control-Allow-Origin字段。
		坛

		```json
		Access-Control-Allow-origin: http://localhost:8081
		Content-Length: 20
		Content-Type:text/plain;
		charset=UTF-8
		Date: Thu,12 Jul 2018 12:51:14 GMT
		```

		

- 非简单请求

	简单请求之外都是非简单请求

	对于非简单请求的跨源请求，浏览器会在真实请求发出前增加一次OPTION请求，称为预检请求(preflight request)
	预检请求将真实请求的信息，包括请求方法、自定义头字段、源信息添加到HTTP头信息字段中，询问服务器是否允许这样的操作。
	例如一个GET请求:

	```
	OPTIONS /test HTTP/1.1
	Origin: http://www.test.com
	Access-Control-Request-Method: GET
	Access-Control-Request-Headers: X-Custom-Header
	Host: www.test.com
	```

	Access-Control-Request-Method表示请求使用的HTTP方法，Access-Control-Request-Headers包含请求的自定义头字段

	

	服务器收到请求时，需要分别对Origin、Access-Control-Request-Method、Access-Control-Request-Headers进行验证，验证通过后，会在返回HTTP头信息中添加:

	```
	Access-Control-Allow-Origin: http: //www.test.com
	Access-Control-Allow-Methods: GET,POST,PUT,DELETE
	Access-Control-Allow-Headers: X-Custom-Header
	Access-Control-Allow-Credentials:true
	Access-Control-Max-Age: 1728000
	```

	Access-Control-Allow-Methods、Access-Control-Allow-Headers:真实请求允许的方法、允许使用的字段
	Access-Control-Allow-Credentials:是否允许用户发送、处理cookie
	Access-Control-Max-Age:预检请求的有效期，单位为秒，有效期内不用重新发送预检请求。

在Springboot中在mvc配置类中添加

```java
    @Override
    public void addCorsMappings (CorsRegistry registry) {
        registry.addMapping("/**")//允许跨域访问的路径
                .allowedOrigins("*")//允许跨域访问的源
                .allowedMethods("*")//允许请求方
                .maxAge(168000)//预检间隔时间
                .allowedHeaders("*");//允许头部设置
//                .allowCredentials(true);//是否发送cookie ps.这个加了就无法生效我也不知道为什么
    }
```

**如果不想自定义策略使用默认配置，只需要在相关Controller中添加注解`@CrossOrigin   `即可**

# 前后端交互

掌握了以上的知识，我们尝试将后端的数据渲染到前端页面。

我们尝试从数据库取出数据，以表格形式显示在前端。



- 前端通过`axios`向后端发送请求

	```js
	  interface User {
	    qq: string
	    phone: string
	
	
	  }
	  const tableData = ref<User[]>([]);
	
	  onMounted(()=>{
	    console.log('Table.vue created')
	    axios.get('http://localhost:8080/user').then((response)=>{
	    console.log(response.data)
	     tableData.value= response.data
	      })
	  }) 
	```

	这是Vue3的语法，`created`变成了`onMounted`
	
	`()={}`是回调函数
	
	
	
- 后端开启`/user`路由，返回数据：
	
	- Mapper接口:
	
	```java
	@Mapper
	public interface QQMapper {
	    @Select("SELECT * FROM qq WHERE qq=3417759874\n" +
	            " OR qq=690420902\n" +
	            " OR qq=669630546\n")
	    public List<qq_phone> find();
	}
	
	```
	
	- 控制类
	
		```java
		@RestController
		public class QQController {
			
		    @CrossOrigin//跨域请求允许
		    @Autowired
		    private QQMapper qqMapper;
		    @GetMapping("/user")
		    public List<qq_phone> query(){
		        List<qq_phone> list=qqMapper.find();
		        System.out.println(list);
		        return list;
		    }
		}
		
		```
	
	- 前端得到数据渲染
	
		```vue
		<template>
		    <el-table
		      :data="tableData"
		      style="width: 100%"
		      :row-class-name="tableRowClassName"
		    >
		      <el-table-column prop="qq" label="qq" width="180" />
		      <el-table-column prop="phone" label="phone" width="180" />
		    </el-table>
		  </template>
		```

在实际项目开发中，几乎每个组件中都会用到axios 发起数据请求。此时会遇到如下两个问题:

- 每个组件中都需要导入axios
- 每次发请求都需要填写完整的请求路径

可以通过全局配置的方式解决上述问题在`main.js`:

```js
// 配置请求根路径
axios.defaults.baseURL = 'http://localhost:8080'
// 全局属性
app.config.globalProperties.$axios = axios
```

在某个组件中`xxx.vue`:

```js
const curInstance= getCurrentInstance()！;//添加非空断言'!'否则编译器报错可能为空，即使项目正常运行
onMounted(()=>{
    console.log('Table.vue created')  
    const {$axios}=curInstance.appContext.config.globalProperties;
    $axios.get('/user').then((response)=>{
    console.log(response.data)
     tableData.value= response.data
      })
}) 

```

# vue-router

Vue路由`vue-router`是官方的路由插件，能够轻松的管理SPA项目中组件的切换。
Vue的单页面应用是基于路由和组件的，路由用于设定访问路径，并将路径和组件映射起来
vue-router目前有3.x的版本和4.x的版本，vue-router 3.x只能结合vue2进行使用，vue-router 4.x只能结合vue3进行使用

[官方文档](https://router.vuejs.org/zh/introduction.html)

安装: 

```bash
npm install vue-router@4
```

有三个组件:`Discover.vue` `Friends.vue` `My.vue`，我想通过`/discover`,`/friends`,`/my.vue`这三个路由来控制它们的显示

## 使用

- 新建文件夹`router`保存路由文件

- 新建`index.js`

```js
import * as VueRouter from 'vue-router';
import Discover from '../components/Discover.vue'
import My from '../components/My.vue'
import Friends from '../components/Friends.vue'



const route = VueRouter.createRouter({
    routes: [
        {
            path: '/discover',
            component: Discover
        },
        {
            path: '/my',
            component: My
        },
        {
            path: '/friends',
            component: Friends
        }
    ],
    history: VueRouter.createWebHashHistory(),
})

export default route;
```

- `main.js`:

```js
import './assets/main.css'
import router from './router/index';
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App);

// 使用 Vue Router
app.use(router);

app.mount('#app');
```

- 在根组件通过`<router-link to="/name"></router-link>`来进行跳转，组件内容会渲染到`<router-view></router-view>`

## 子路由

在参数"`route`中添加

```json
        {
            path: '/my',
            component: My,
            children:[
                {path:'sing',component:Sing}
            ]
        },
```

这样写当访问`/my/sing`时会渲染`Sing.vue`的内容

## 重定向

在参数"`route`中:

```js
    routes: [
        {
            path: '/',
            redirect: '/discover',


        },
	]
```

## 动态路由



```js
    routes: [
        {
            path: '/product/1',
            redirect: '/discover',           
        },
         {
            path: '/product/2',
            redirect: '/discover',           
        },
        {
            path: '/product/2',
            redirect: '/discover',           
        },        
	]
```



我们给每个商品做对应渲染，如果按照刚才的方法代码复用性很差，有1亿个商品，难不成我要配置1亿个路由？

因此需要动态路由。

**动态路由**指的是:把Hash地址中可变的部分定义为参数项，从而提高路由规则的复用性。在vue-router 中使用英文的冒号(:)来定义路由的参数项。示例代码如下:

```js
{path: '/product/:id ',component :Product}
```

在组件中可以通过`$route.params.id`获取`id`的值，名字不一定非得是`id`

# VueX

对于组件化开发来说，大型应用的状态往往跨越多个组件。在多层嵌套的父子组件之间传递状态已经十分麻烦，而Vue更是没有为兄弟组件提供直接共享数据的办法。
基于这个问题，许多框架提供了解决方案——使用全局的状态管理器，将所有分散的共享数据交由状态管理器保管，Vue也不例外。
Vuex是一个专为Vue.js应用程序开发的状态管理库，采用集中式存储管理应用的所有组件的状态。
简单的说，**Vuex用于管理分散在Vue各个组件中的数据。**

[官网地址](https://vuex.vuejs.org/zh/index.html)

- 安装

	```bash
	npm install vuex@next --save
	```

	

每一个Vuex应用的核心都是一个store，与普通的全局对象不同的是，基于Vue数据与视图绑定的特点，当store中的状态发生变化时，与之绑定的视图也会被重新渲染。
store中的状态不允许被直接修改，改变store中的状态的唯一途径就是显式地提交(commit) mutation，这可以让我们方便地跟踪每一个状态的变化。在大型复杂应用中，如果无法有效地跟踪到状态的变化，将会对理解和维护代码带来极大的困扰。
Vuex中有5个重要的概念: State、Getter、Mutation、Action、Module。

![image-20230715114007596](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202307151140442.png)







## state

State用于维护所有应用层的状态，并确保应用只有唯一的数据源.

```js
// 创建一个新的 store 实例
const store = createStore({
  state () {
    return {
      count: 0
    }
  },
  mutations: {
    increment (state) {
      state.count++
    }
  }
})
```

如果我们想在其他组件访问`count`可以用`this.$store.count`获取

## Getter

Getter维护由State派生的一些状态，这些状态随着State状态的变化而变化

```js
const store = createstore({
    state:{
        todos : [
            { id: 1,text: '...', done: true },
            {id: 2,text: '...', done: false }
        ]
    },
    getters : {
            doneTodos : (state) =>{
            return state.todos.filter(todo => todo.done)
        }
    }
})
```

## Mutation

在组件中，可以直接使用store.commit来提交mutation,也可以先用mapMutation辅助函数将其映射下来

## Action

Action类似Mutation，不同在于:

Action不能直接修改状态，只能通过提交mutation来修改，

Action可以包含异步操作

```js
const store = createstore({
    state:{
        count: 0
    },
    mutations : {
        increment (state) {
            state.count++ //直接修改状态
        }
    },
    actions : {
        increment (context) {
            context.commit('increment') //只能提交来修改
        }
    }
}
```



在组件中，可以直接使用`this.$store.dispatch('xxx')`分发action，或者使用`mapActions`辅助函数先将其映射下来

```js
methods : {
    ...mapActions([
    'increment ',// 将`this.increment()映射为“‘this.$store.dispatch( ' increment ')
    //mapActions`也支持载荷:
    'incrementBy'//将‘this. incrementBy(amount)”映射为‘this.$store.dispatch(' incrementBy'，amount))])，
    ])
}
```



## Module

由于使用单一状态树，应用的所有状态会集中到一个比较大的对象。当应用变得非常复杂时，store 对象就有可能变得相当臃肿。

为了解决以上问题，Vuex 允许我们将 store 分割成**模块（module）**。每个模块拥有自己的 state、mutation、action、getter、甚至是嵌套子模块——从上至下进行同样方式的分割：

```js
const moduleA = {
  state: () => ({ ... }),
  mutations: { ... },
  actions: { ... },
  getters: { ... }
}

const moduleB = {
  state: () => ({ ... }),
  mutations: { ... },
  actions: { ... }
}

const store = createStore({
  modules: {
    a: moduleA,
    b: moduleB
  }
})

store.state.a // -> moduleA 的状态
store.state.b // -> moduleB 的状态
```

## 使用

```js
import { createApp } from "vue";
import App from "./App.vue";
import vuex from "vuex";


// 创建一个新的 store 实例
const store = createStore({
    state () {
      return {
        count: 0
      }
    },
    mutations: {
      increment (state) {
        state.count++
      }
    }
  })

 app.use(store);
```



# Mock.js

Mock.js是一款前端开发中拦截Ajax请求再生成随机数据响应的工具，可以用来模拟服务器响应.
优点是非常简单方便,无侵入性,基本覆盖常用的接口数据类型..
支持生成随机的文本、数字、布尔值、日期、邮箱、链接、图片、颜色等。

[官方文档](https://github.com/nuysoft/Mock/wiki/Getting-Started)

安装: 

```
npm install mockjs
```


![image-20230715135128820](https://blog-faithererer.oss-cn-qingdao.aliyuncs.com/blog/typoraImg202307151351102.png)
