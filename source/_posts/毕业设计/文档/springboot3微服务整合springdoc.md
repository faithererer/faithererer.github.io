---
title: springboot3微服务整合springdoc
mathjax: true
abbrlink: 3d4c07bc
date: 2025-01-26 00:00:00
tags:
cover:
categories:
---
统一使用`2.6.0`，springboot版本`3.0.2`
# 业务微服务:
```xml

<dependency>  
    <groupId>org.springdoc</groupId>  
    <artifactId>springdoc-openapi-starter-webmvc-api</artifactId>  
</dependency>  
<dependency>  
    <groupId>org.springframework.boot</groupId>  
    <artifactId>spring-boot-starter-web</artifactId>  
</dependency>
```


配置
```yaml
springdoc:  
  api-docs:  
    enabled: true  
    path: /v3/api-docs  
  swagger-ui:  
    enabled: true  
    path: /swagger-ui.html  
  packages-to-scan: com.zjc.clouduser.controller  
```

配置类
```java
@Configuration  
public class MicroserviceSpringDocConfig {  
      
    @Bean  
    public OpenAPI springShopOpenAPI() {  
        return new OpenAPI()  
                .info(new Info().title("用户服务 API")  
                        .description("用户服务接口文档")  
                        .version("v1.0")  
                        .license(new License().name("Apache 2.0").url("http://springdoc.org")))  
                .externalDocs(new ExternalDocumentation()  
                        .description("用户服务 Wiki 文档")  
                        .url("https://springshop.wiki.github.org/docs"));  
    }  
}
```


# 网关整合
使用webflux而不是mvc

```xml
<dependency>  
    <groupId>org.springdoc</groupId>  
    <artifactId>springdoc-openapi-starter-webflux-ui</artifactId>  
</dependency>  
<dependency>  
    <groupId>org.springdoc</groupId>  
    <artifactId>springdoc-openapi-starter-webflux-api</artifactId>  
</dependency>
```

配置:
```yaml
springdoc:  
  api-docs:  
    enabled: true  
  swagger-ui:  
    path: /swagger-ui.html

cloud:  
  gateway:  
    discovery:  
      locator:  
        enabled: true  
        lower-case-service-id: true  
    routes:  
      # 各个服务路由  
      - id: cloud-user  
        uri: lb://cloud-user  
        predicates:  
          - Path=/user/**,/cloud-user/**  
        filters:  
          - RewritePath=/cloud-user(?<segment>.*), $\{segment}
```

配置类
```java
@Configuration  
public class SpringDocConfig {  
      
    private final SwaggerUiConfigProperties swaggerUiConfigProperties;  
    private final DiscoveryClient discoveryClient;  
  
    public SpringDocConfig(SwaggerUiConfigProperties swaggerUiConfigProperties,   
                         DiscoveryClient discoveryClient) {  
        this.swaggerUiConfigProperties = swaggerUiConfigProperties;  
        this.discoveryClient = discoveryClient;  
    }  
  
    @Bean  
    public OpenAPI openAPI() {  
        return new OpenAPI()  
                .info(new Info()  
                        .title("微服务API文档")  
                        .version("1.0")  
                        .description("微服务接口文档"));  
    }  
  
    @PostConstruct  
    public void init() {  
        Set<AbstractSwaggerUiConfigProperties.SwaggerUrl> urls = new LinkedHashSet<>();  
          
        discoveryClient.getServices().stream()  
                .filter(serviceId -> !serviceId.equals("gateway"))  
                .forEach(serviceId -> {  
                    urls.add(new AbstractSwaggerUiConfigProperties.SwaggerUrl(  
                            serviceId,  
                            "/" + serviceId.toLowerCase() + "/v3/api-docs",  
                            serviceId + " API"  
                    ));  
                });  
  
        swaggerUiConfigProperties.setUrls(urls);  
    }  
}
```


放行端口:
```shell
  
// Swagger UI 相关路径  
"/swagger-resources/**",  
"/swagger-ui.html",  
"/swagger-ui/**",  
"/webjars/**",  
  
// OpenAPI 文档路径  
"/v3/api-docs/**",  
"/*/v3/api-docs/**",  // 重要：匹配服务名前缀的文档路径  
"/v3/api-docs/swagger-config",  
  
// Knife4j 相关路径  
"/doc.html",
```