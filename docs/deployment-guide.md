# DolphinScheduler 1.3.9 服务器部署文档

---

## 一、环境要求

| 组件 | 版本 | 说明 |
|------|------|------|
| OS | CentOS 7+ / Ubuntu 18+（64 位） | 所有节点必须可互通 |
| JDK | 1.8+ | 路径在所有节点保持一致（建议） |
| MySQL | 5.7+ / 8.0+ | 作为元数据库 |
| ZooKeeper | 3.4.6+ | 建议 3 节点集群，所有节点可访问 |
| 节点内存 | >= 8 GB | 依据角色与并发做 JVM 调优 |
| 网络 | 节点间互通（SSH + TCP） | Master/Worker/Api/Logger 需要通信 |

> 说明：本部署指南以 MySQL + ZooKeeper 为例。若你使用 PostgreSQL，请同步调整 `conf/datasource.properties` 里的 driver/url。

---

## 二、集群规划

以 5 节点为例（可按实际规模增减）：

| 主机名 | IP | 部署服务 |
|--------|----|----------|
| ds-master-1 | 192.168.1.101 | MasterServer（master-server） |
| ds-master-2 | 192.168.1.102 | MasterServer（master-server） |
| ds-worker-1 | 192.168.1.103 | WorkerServer + LoggerServer（worker-server + logger-server） |
| ds-worker-2 | 192.168.1.104 | WorkerServer + LoggerServer（worker-server + logger-server） |
| ds-api | 192.168.1.105 | ApiServer + AlertServer（api-server + alert-server） |

### 端口说明（默认值）

| 服务 | 默认端口 | 说明 |
|------|-----------|------|
| ApiServer HTTP | `12345` | `conf/application-api.properties`：`server.port` |
| MasterServer 监听 | `5678` | `master.listen.port`（默认值，通常不需要改） |
| WorkerServer 监听 | `1234` | `worker.listen.port`（默认值，通常不需要改） |
| ZooKeeper | `2181` | ZooKeeper 集群端口 |
| MySQL | `3306` | 元数据库端口 |

---

## 三、部署前准备（所有节点执行）

### 3.1 创建部署用户

每个节点都执行：

```bash
useradd dolphinscheduler
echo 'dolphinscheduler ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers
passwd dolphinscheduler
```

> 如果你有统一运维账号体系，可以按需调整，但要保证后续脚本用的 deploy user 具备 sudo 权限。

### 3.2 配置节点间免密 SSH

选择一台管理节点（例如 `ds-api`），以 `dolphinscheduler` 用户生成并分发密钥：

```bash
su - dolphinscheduler

ssh-keygen -t rsa -P '' -f ~/.ssh/id_rsa

for host in 192.168.1.101 192.168.1.102 192.168.1.103 192.168.1.104 192.168.1.105; do
  ssh-copy-id dolphinscheduler@$host
done

for host in 192.168.1.101 192.168.1.102 192.168.1.103 192.168.1.104 192.168.1.105; do
  ssh dolphinscheduler@$host "echo $host ok"
done
```

### 3.3 解压安装包（所有节点）

假设安装目录为 `/data/dolphinscheduler`（建议与后续配置一致）：

```bash
tar -zxvf apache-dolphinscheduler-1.3.9-bin.tar.gz -C /data/dolphinscheduler --strip-components=1
cd /data/dolphinscheduler
chown -R dolphinscheduler:dolphinscheduler /data/dolphinscheduler
```

> 若你采用其他目录，请同时修改后续配置里的 `installPath`（如果你使用 `install.sh` 自动部署）。

### 3.4 放置 MySQL JDBC Driver（所有节点）

如果你的二进制包不包含 MySQL 驱动，可以用 `wget` 直接下载 JDBC 驱动到 `$DS_HOME/lib/`：

```bash
wget -O /data/dolphinscheduler/lib/mysql-connector-java-8.0.28.jar https://repo1.maven.org/maven2/mysql/mysql-connector-java/8.0.28/mysql-connector-java-8.0.28.jar
```

---

## 四、MySQL 初始化（执行一次）

在任意可以访问 MySQL 的节点执行一次（以 `root` 登录举例）：

```sql
CREATE DATABASE dolphinscheduler
  DEFAULT CHARACTER SET utf8
  DEFAULT COLLATE utf8_general_ci;

CREATE USER 'ds_user'@'%' IDENTIFIED BY 'YourPassword123!';
GRANT ALL PRIVILEGES ON dolphinscheduler.* TO 'ds_user'@'%';
FLUSH PRIVILEGES;
```

导入表结构：

```bash
mysql -u ds_user -p dolphinscheduler < /data/dolphinscheduler/sql/dolphinscheduler_mysql.sql
```

---

## 五、配置文件修改（所有节点相同）

建议：先在一台节点上编辑好，再 `scp` 分发到所有节点。

### 5.1 `conf/env/dolphinscheduler_env.sh`（JDK 路径）

```bash
# Replace with the actual JDK path on your servers
export HADOOP_HOME=/opt/soft/hadoop
export HADOOP_CONF_DIR=/opt/soft/hadoop/etc/hadoop
export SPARK_HOME1=/opt/soft/spark1
export SPARK_HOME2=/opt/soft/spark2
export PYTHON_HOME=/opt/soft/python
# java path
export JAVA_HOME=/opt/soft/java
export HIVE_HOME=/opt/soft/hive
export FLINK_HOME=/opt/soft/flink
export DATAX_HOME=/opt/soft/datax

export PATH=$HADOOP_HOME/bin:$SPARK_HOME1/bin:$SPARK_HOME2/bin:$PYTHON_HOME:$JAVA_HOME/bin:$HIVE_HOME/bin:$FLINK_HOME/bin:$DATAX_HOME/bin:$PATH

```

> `dolphinscheduler-daemon.sh` 启动进程时会使用“当前 shell 环境变量”里的 `JAVA_HOME`。
> 它不会自动读取/加载 `conf/env/dolphinscheduler_env.sh`，所以你需要在启动前手工 `source conf/env/dolphinscheduler_env.sh`，或将 `JAVA_HOME` 配置到系统环境（例如 `/etc/profile`）。

### 5.2 `conf/datasource.properties`（MySQL 连接）

```properties
spring.datasource.driver-class-name=com.mysql.jdbc.Driver
spring.datasource.url=jdbc:mysql://192.168.1.200:3306/dolphinscheduler?useUnicode=true&characterEncoding=UTF-8&allowMultiQueries=true
spring.datasource.username=ds_user
spring.datasource.password=YourPassword123!
```

### 5.3 `conf/zookeeper.properties`（ZooKeeper 集群）

```properties
# ZooKeeper quorum list, comma-separated
zookeeper.quorum=192.168.1.201:2181,192.168.1.202:2181,192.168.1.203:2181

# DolphinScheduler root znode
zookeeper.dolphinscheduler.root=/dolphinscheduler
```

### 5.4 分发配置到所有节点

在你编辑完成的节点执行：

```bash
for host in 192.168.1.101 192.168.1.102 192.168.1.103 192.168.1.104 192.168.1.105; do
  echo "Distributing config to $host ..."
  scp /data/dolphinscheduler/conf/env/dolphinscheduler_env.sh   dolphinscheduler@$host:/data/dolphinscheduler/conf/env/
  scp /data/dolphinscheduler/conf/datasource.properties         dolphinscheduler@$host:/data/dolphinscheduler/conf/
  scp /data/dolphinscheduler/conf/zookeeper.properties          dolphinscheduler@$host:/data/dolphinscheduler/conf/
  scp /data/dolphinscheduler/conf/application-api.properties   dolphinscheduler@$host:/data/dolphinscheduler/conf/
  scp /data/dolphinscheduler/conf/alert.properties              dolphinscheduler@$host:/data/dolphinscheduler/conf/
  scp /data/dolphinscheduler/conf/common.properties             dolphinscheduler@$host:/data/dolphinscheduler/conf/
done
```

---

## 六、各节点启动对应服务

确保 ZooKeeper 集群和 MySQL 正常运行后启动。

> LoggerServer 必须与 WorkerServer 同节点部署，用于任务日志查询。

### 6.1 `ds-master-1` / `ds-master-2`

```bash
su - dolphinscheduler && cd /data/dolphinscheduler
source conf/env/dolphinscheduler_env.sh
sh bin/dolphinscheduler-daemon.sh start master-server
```

### 6.2 `ds-worker-1` / `ds-worker-2`

```bash
su - dolphinscheduler && cd /data/dolphinscheduler
source conf/env/dolphinscheduler_env.sh
sh bin/dolphinscheduler-daemon.sh start worker-server
sh bin/dolphinscheduler-daemon.sh start logger-server
```

### 6.3 `ds-api`

```bash
su - dolphinscheduler && cd /data/dolphinscheduler
source conf/env/dolphinscheduler_env.sh
sh bin/dolphinscheduler-daemon.sh start api-server
sh bin/dolphinscheduler-daemon.sh start alert-server
```

### 6.4 验证各节点状态

```bash
# Check processes
jps -l | grep dolphinscheduler

# Tail logs (example: api-server)
tail -f logs/dolphinscheduler-api-server-$(hostname).out
```

### 6.5 访问 Web UI

```text
http://<ds-api-ip>:12345/dolphinscheduler
默认账号：admin / dolphinscheduler123
```

---

## 七、配置来源总结

| 配置项 | 写在哪里 | 生效原理 |
|--------|----------|-----------|
| `JAVA_HOME` | `conf/env/dolphinscheduler_env.sh` | 启动脚本使用 `JAVA_HOME` 拉起 Java 进程 |
| `spring.datasource.*` | `conf/datasource.properties` | Spring Boot 读取数据源配置 |
| `zookeeper.quorum` | `conf/zookeeper.properties` | ZooKeeper 注册/选主依赖此配置 |
| `zookeeper.dolphinscheduler.root` | `conf/zookeeper.properties` | DolphinScheduler 的根 znode |
| `server.port` | `conf/application-api.properties` | API/UI 对外端口 |
| `mail.*` / `enterprise.wechat.*` | `conf/alert.properties` | 告警通道配置（邮件/企业微信） |
| 资源存储相关 | `conf/common.properties` | 影响资源上传/下载与资源寻址方式 |

---

## 八、常见问题排查

### 1. OOM（内存不足）

优先降低并发/任务规模；如需调整堆大小，可以在启动前临时设置环境变量（daemon 会追加这些变量）：

```bash
export MASTER_SERVER_OPTS="-Xms1g -Xmx1g -Xmn512m"
export WORKER_SERVER_OPTS="-Xms1g -Xmx1g -Xmn512m"
export API_SERVER_OPTS="-Xms512m -Xmx512m -Xmn256m"
export ALERT_SERVER_OPTS="-Xms512m -Xmx512m -Xmn256m"
export LOGGER_SERVER_OPTS="-Xms512m -Xmx512m -Xmn256m"

sh bin/dolphinscheduler-daemon.sh stop master-server
sh bin/dolphinscheduler-daemon.sh start master-server
```

### 2. ZooKeeper 连接失败

```bash
for zk in 192.168.1.201 192.168.1.202 192.168.1.203; do
  echo "ruok" | nc $zk 2181 | tr -d '\r'
done
```

期望输出应包含 `imok`。

### 3. 节点未注册到 Web UI

- 确保所有节点 `conf/zookeeper.properties` 里的 `zookeeper.dolphinscheduler.root` 一致
- 确保 ZooKeeper quorum 地址一致

### 4. MySQL 连接失败

- 检查 `conf/datasource.properties` 的 `url/username/password` 是否正确
- 检查相应 JDBC 驱动 jar 是否存在于 `lib/`
- 检查 MySQL 网络连通性（从运行 DolphinScheduler 的机器访问 MySQL）

### 5. 任务日志在 UI 看不到

- 确认 Worker 节点已启动 `logger-server`
- 查看日志文件：

```bash
tail -f /data/dolphinscheduler/logs/dolphinscheduler-logger-server-$(hostname).out
```

### 6. 常用日志定位

```bash
tail -f logs/dolphinscheduler-master-server-$(hostname).out
tail -f logs/dolphinscheduler-worker-server-$(hostname).out
tail -f logs/dolphinscheduler-api-server-$(hostname).out
tail -f logs/dolphinscheduler-alert-server-$(hostname).out
tail -f logs/dolphinscheduler-logger-server-$(hostname).out
tail -f logs/gc.log
```
