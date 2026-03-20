# DolphinScheduler 1.3.9 服务器部署文档

## 一、环境要求

| 依赖 | 版本要求 |
|------|---------|
| JDK | 1.8+ |
| MySQL | 5.7+ |
| ZooKeeper | 3.4.6+ |
| OS | Linux（推荐 CentOS 7+） |

---

## 二、构建二进制包（本机执行）

```bash
cd /path/to/dolphinscheduler
./mvnw clean install -Prelease -Dmaven.test.skip=true
```

产物路径：

```
dolphinscheduler-dist/target/apache-dolphinscheduler-1.3.9-bin.tar.gz
```

---

## 三、上传并解压到服务器

```bash
# 上传
scp dolphinscheduler-dist/target/apache-dolphinscheduler-1.3.9-bin.tar.gz user@server:/opt/

# 登录服务器并解压
ssh user@server
mkdir -p /opt/dolphinscheduler
tar -zxvf /opt/apache-dolphinscheduler-1.3.9-bin.tar.gz -C /opt/dolphinscheduler --strip-components=1
cd /opt/dolphinscheduler
```

---

## 四、初始化数据库

```bash
# 创建数据库
mysql -u root -p -e "CREATE DATABASE dolphinscheduler DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;"

# 导入表结构
mysql -u root -p dolphinscheduler < sql/dolphinscheduler_mysql.sql
```

---

## 五、修改配置文件

### 5.1 JAVA_HOME（`conf/env/dolphinscheduler_env.sh`）

```bash
# 修改为服务器实际 JDK 路径
export JAVA_HOME=/usr/lib/jvm/java-1.8.0-openjdk
```

> 查找服务器 JDK 路径：`which java` 或 `alternatives --list | grep java`

### 5.2 数据库（`conf/datasource.properties`）

```properties
spring.datasource.driver-class-name=com.mysql.jdbc.Driver
spring.datasource.url=jdbc:mysql://127.0.0.1:3306/dolphinscheduler?useUnicode=true&characterEncoding=UTF-8&allowMultiQueries=true
spring.datasource.username=root
spring.datasource.password=your_password
```

### 5.3 ZooKeeper（`conf/zookeeper.properties`）

```properties
# 单节点
zookeeper.quorum=localhost:2181

# 集群（多节点用逗号分隔）
# zookeeper.quorum=zk1:2181,zk2:2181,zk3:2181
```

---

## 六、启动服务

```bash
cd /opt/dolphinscheduler

sh bin/dolphinscheduler-daemon.sh start api-server
sh bin/dolphinscheduler-daemon.sh start master-server
sh bin/dolphinscheduler-daemon.sh start worker-server
sh bin/dolphinscheduler-daemon.sh start alert-server
sh bin/dolphinscheduler-daemon.sh start logger-server
```

---

## 七、验证

```bash
# 查看进程
jps -l | grep dolphinscheduler

# 查看日志（以 api-server 为例）
tail -f logs/dolphinscheduler-api-server-$(hostname).out
```

浏览器访问：`http://<server-ip>:12345/dolphinscheduler`

默认账号：`admin` / `dolphinscheduler123`

---

## 八、停止服务

```bash
sh bin/dolphinscheduler-daemon.sh stop logger-server
sh bin/dolphinscheduler-daemon.sh stop alert-server
sh bin/dolphinscheduler-daemon.sh stop worker-server
sh bin/dolphinscheduler-daemon.sh stop master-server
sh bin/dolphinscheduler-daemon.sh stop api-server
```

---

## 附：日志目录

| 服务 | 日志文件 |
|------|---------|
| api-server | `logs/dolphinscheduler-api-server-<hostname>.out` |
| master-server | `logs/dolphinscheduler-master-server-<hostname>.out` |
| worker-server | `logs/dolphinscheduler-worker-server-<hostname>.out` |
| alert-server | `logs/dolphinscheduler-alert-server-<hostname>.out` |
| logger-server | `logs/dolphinscheduler-logger-server-<hostname>.out` |
| GC 日志 | `logs/gc.log` |
