---
title: 使用SpringBoot解决跨域请求
tags: [SpringBoot,跨域问题]
mathjax: true
cover: https://vip1.loli.io/2022/05/12/Z746KJUiaulVYsj.jpg
date: 2023-08-07 15:01:42
---

# 问题

当我用js的axios库向指定api发送请求获取数据时常常会遇到跨域请求问题

```js
Access to XMLHttpRequest at 'https://www.**' from origin 'http://127.0.0.1:5501' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

我尝试使用springboot代理此次请求。

编写一个控制器

```java
@RestController
public class proxy {

    @CrossOrigin
    @GetMapping("/get")
    public String getPic(String kwd){
        HttpHeaders headers = new HttpHeaders();
        RestTemplate restTemplate=new RestTemplate();

        String url1="https://www.baidu.com";
        Map<String, String>params=new HashMap<>();
        params.put("p","1");
        HttpEntity<Map<String, String>> entity = new HttpEntity<>(params, headers);
        String url="https://www.pixivs.cn/ajax/search/artworks/"+kwd;
        System.out.println(url);
        headers.add("user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.99 Safari/537.36");
        String res= restTemplate.exchange(url,HttpMethod.GET,entity ,String.class).getBody();
        System.out.println(res);
        return res;
    }
}

```



