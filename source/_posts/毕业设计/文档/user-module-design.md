---
title: 用户模块设计文档
tags: 
mathjax: true
cover: https://img.loliapi.cn/i/pc/img683.webp
categories: 
date: 2025-04-30
published: false
abbrlink: 485079eb
---

 


## 1. 数据库表设计

### 1.1 核心表结构

#### sys_user（用户基本信息表）
```sql
CREATE TABLE `sys_user` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `username` varchar(64) NOT NULL COMMENT '用户名',
  `password` varchar(128) NOT NULL COMMENT '密码',
  `email` varchar(128) DEFAULT NULL COMMENT '邮箱',
  `mobile` varchar(32) DEFAULT NULL COMMENT '手机号',
  `nickname` varchar(64) DEFAULT NULL COMMENT '昵称',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像URL',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '状态：0-禁用 1-启用 2-锁定',
  `user_type` tinyint(4) NOT NULL DEFAULT '0' COMMENT '用户类型：0-普通用户 1-管理员',
  `last_login_time` datetime DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` varchar(64) DEFAULT NULL COMMENT '最后登录IP',
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`),
  UNIQUE KEY `uk_mobile` (`mobile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户基本信息表';
```

#### sys_user_auth（用户认证信息表）
```sql
CREATE TABLE `sys_user_auth` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `login_type` tinyint(4) NOT NULL COMMENT '登录类型：1-密码 2-手机验证码 3-邮箱验证码 4-第三方',
  `identifier` varchar(128) NOT NULL COMMENT '认证标识（用户名/手机号/邮箱/第三方ID）',
  `credential` varchar(128) NOT NULL COMMENT '认证凭证（密码/token）',
  `third_party` varchar(32) DEFAULT NULL COMMENT '第三方类型（微信/GitHub等）',
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_type_identifier` (`user_id`, `login_type`, `identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户认证信息表';
```

#### sys_user_storage（用户存储配额表）
```sql
CREATE TABLE `sys_user_storage` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `total_space` bigint(20) NOT NULL DEFAULT '0' COMMENT '总空间配额(byte)',
  `used_space` bigint(20) NOT NULL DEFAULT '0' COMMENT '已用空间(byte)',
  `private_space` bigint(20) NOT NULL DEFAULT '0' COMMENT '私有空间配额(byte)',
  `share_space` bigint(20) NOT NULL DEFAULT '0' COMMENT '共享空间配额(byte)',
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户存储配额表';
```

#### sys_user_settings（用户设置表）
```sql
CREATE TABLE `sys_user_settings` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `setting_key` varchar(64) NOT NULL COMMENT '设置项键',
  `setting_value` varchar(255) NOT NULL COMMENT '设置项值',
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_key` (`user_id`, `setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户设置表';
```

### 1.2 日志表

#### sys_user_login_log（用户登录日志表）
```sql
CREATE TABLE `sys_user_login_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `login_type` tinyint(4) NOT NULL COMMENT '登录类型',
  `login_ip` varchar(64) NOT NULL COMMENT '登录IP',
  `login_location` varchar(255) DEFAULT NULL COMMENT '登录地点',
  `device_type` varchar(32) DEFAULT NULL COMMENT '设备类型',
  `device_info` varchar(255) DEFAULT NULL COMMENT '设备信息',
  `status` tinyint(4) NOT NULL COMMENT '状态：0-失败 1-成功',
  `msg` varchar(255) DEFAULT NULL COMMENT '消息（失败原因）',
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_time` (`created_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户登录日志表';
```

#### sys_user_operation_log（用户操作日志表）
```sql
CREATE TABLE `sys_user_operation_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `operation_type` varchar(32) NOT NULL COMMENT '操作类型',
  `operation_desc` varchar(255) NOT NULL COMMENT '操作描述',
  `request_method` varchar(16) DEFAULT NULL COMMENT '请求方法',
  `request_url` varchar(255) DEFAULT NULL COMMENT '请求URL',
  `request_params` text DEFAULT NULL COMMENT '请求参数',
  `response_result` text DEFAULT NULL COMMENT '响应结果',
  `execution_time` bigint(20) DEFAULT NULL COMMENT '执行时间(ms)',
  `ip_address` varchar(64) DEFAULT NULL COMMENT 'IP地址',
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_time` (`created_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户操作日志表';
```


角色表
角色表(sys_role)设计：

 ```sql
 CREATE TABLE `sys_role` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `role_name` varchar(64) NOT NULL COMMENT '角色名称',
  `role_code` varchar(64) NOT NULL COMMENT '角色编码',
  `description` varchar(255) DEFAULT NULL COMMENT '角色描述',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '状态：0-禁用 1-启用',
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_code` (`role_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';
```

权限表(sys_permission)设计：
```sql
CREATE TABLE `sys_permission` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `parent_id` bigint(20) DEFAULT NULL COMMENT '父级权限ID',
  `permission_name` varchar(64) NOT NULL COMMENT '权限名称',
  `permission_code` varchar(64) NOT NULL COMMENT '权限编码',
  `permission_type` tinyint(4) NOT NULL COMMENT '权限类型：1-菜单 2-按钮 3-接口',
  `path` varchar(255) DEFAULT NULL COMMENT '路由地址',
  `component` varchar(255) DEFAULT NULL COMMENT '前端组件',
  `icon` varchar(255) DEFAULT NULL COMMENT '图标',
  `sort` int(11) DEFAULT '0' COMMENT '排序',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '状态：0-禁用 1-启用',
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_permission_code` (`permission_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限表';
```

用户-角色关联表(sys_user_role)设计：
```sql
CREATE TABLE `sys_user_role` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `role_id` bigint(20) NOT NULL COMMENT '角色ID',
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_role` (`user_id`,`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';
```
角色-权限关联表(sys_role_permission)设计：
```sql
CREATE TABLE `sys_role_permission` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `role_id` bigint(20) NOT NULL COMMENT '角色ID',
  `permission_id` bigint(20) NOT NULL COMMENT '权限ID',
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_permission` (`role_id`,`permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色权限关联表';
```
## 2. 基础设施建议

### 2.1 技术选型

#### 核心框架
- SpringCloud Alibaba 2022.0.0.0
- SpringBoot 3.0.0以上
- MyBatis-Plus 3.5.3.1
- MySQL 8.0
- Redis 7.0

#### 认证授权
- Spring Security
- JWT Token

#### 缓存方案
1. 多级缓存
   - 本地缓存：Caffeine
   - 分布式缓存：Redis Cluster
2. 缓存策略
   - 用户基本信息：本地缓存 + Redis
   - 登录Token：Redis
   - 用户设置：本地缓存

#### 数据库方案
1. 主从复制
   - 读写分离
   - 数据备份
2. 分库分表
   - 日志表按时间分表
   - 预留分库设计

### 2.2 项目结构
```
cloud-user/
  ├── cloud-user-api/            # 对外API接口
  │   ├── dto/                   # 数据传输对象
  │   ├── enums/                 # 枚举定义
  │   └── feign/                 # Feign接口
  ├── cloud-user-common/         # 公共模块
  │   ├── config/                # 通用配置
  │   ├── constant/             # 常量定义
  │   └── utils/                # 工具类
  └── cloud-user-service/        # 服务实现
      ├── config/                # 服务配置
      ├── controller/           # 控制器
      ├── service/              # 服务层
      ├── mapper/               # 数据访问层
      └── model/                # 数据模型
```

### 2.3 配置建议

#### Nacos配置
```yaml
spring:
  datasource:
    master:
      url: jdbc:mysql://localhost:3306/cloud_user?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
      username: ${MYSQL_USERNAME}
      password: ${MYSQL_PASSWORD}
    slave:
      url: jdbc:mysql://localhost:3307/cloud_user?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
      username: ${MYSQL_USERNAME}
      password: ${MYSQL_PASSWORD}
  
  redis:
    cluster:
      nodes: ${REDIS_NODES}
    password: ${REDIS_PASSWORD}
    
mybatis-plus:
  global-config:
    db-config:
      logic-delete-field: deleted
      logic-delete-value: 1
      logic-not-delete-value: 0
  
security:
  jwt:
    secret: ${JWT_SECRET}
    expiration: 86400000  # 24小时
```

### 2.4 关键依赖版本
```xml
<dependencies>
    <!-- Spring Cloud Alibaba -->
    <dependency>
        <groupId>com.alibaba.cloud</groupId>
        <artifactId>spring-cloud-alibaba-dependencies</artifactId>
        <version>2022.0.0.0</version>
        <type>pom</type>
        <scope>import</scope>
    </dependency>
    
    <!-- SpringBoot -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-dependencies</artifactId>
        <version>3.0.0</version>
        <type>pom</type>
        <scope>import</scope>
    </dependency>
    
    <!-- MyBatis Plus -->
    <dependency>
        <groupId>com.baomidou</groupId>
        <artifactId>mybatis-plus-boot-starter</artifactId>
        <version>3.5.3.1</version>
    </dependency>
</dependencies>
```

### 2.5 性能优化建议

1. 数据库优化
   - 合理设置索引
   - 使用读写分离
   - 配置数据库连接池

2. 缓存优化
   - 合理设置缓存期限
   - 使用多级缓存
   - 预防缓存雪崩和击穿

3. JVM优化
   - 合理设置堆内存
   - 选择适当的垃圾收集器
   - 启用JVM监控