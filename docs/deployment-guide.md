# DolphinScheduler 2.0.9 部署指南

---

## 目录

- [一、环境要求](#一环境要求)
- [二、集群规划](#二集群规划)
- [三、部署前准备（所有节点）](#三部署前准备所有节点)
- [四、MySQL 初始化（执行一次）](#四mysql-初始化执行一次)
- [五、配置文件修改（所有节点相同）](#五配置文件修改所有节点相同)
- [六、各节点启动对应服务](#六各节点启动对应服务)
- [七、配置来源总结](#七配置来源总结)
- [八、常见问题排查](#八常见问题排查)

---

## 一、环境要求

| 组件 | 版本 | 说明 |
|------|------|------|
| OS | CentOS 7+ / Ubuntu 18+ | 所有节点 64 位 |
| JDK | 1.8+ | 所有节点，路径保持一致 |
| MySQL | 5.7+ / 8.0+ | 独立节点或共享，所有节点可访问 |
| ZooKeeper | 3.4.6+ | 建议 3 节点集群，所有节点可访问 |
| 节点内存 | ≥ 8 GB | 视角色和 JVM 调优而定 |
| 节点间网络 | 互通 | 所有节点间需要 SSH 和 TCP 通信 |

---

## 二、集群规划

以 5 节点为例，可根据实际情况调整：

| 主机名 | IP | 部署服务 |
|--------|-----|---------|
| ds-master-1 | 192.168.1.101 | MasterServer |
| ds-master-2 | 192.168.1.102 | MasterServer |
| ds-worker-1 | 192.168.1.103 | WorkerServer + LoggerServer |
| ds-worker-2 | 192.168.1.104 | WorkerServer + LoggerServer |
| ds-api | 192.168.1.105 | ApiServer + AlertServer |

> **说明：**
> - MasterServer 建议 ≥ 2 个节点，实现调度高可用
> - WorkerServer 按任务并发量水平扩展
> - LoggerServer 必须与 WorkerServer 同节点部署，供 API 查询任务日志
> - MySQL 和 ZooKeeper 可独立部署，此处不计入节点规划

### 端口说明

| 服务 | 端口 | 说明 |
|------|------|------|
| ApiServer HTTP | 12345 | Web UI 和 REST API |
| MasterServer RPC | 5678 | Master 内部 RPC |
| WorkerServer RPC | 1234 | Worker 内部 RPC |
| AlertServer RPC | 50052 | 代码硬编码，不可修改 |
| ZooKeeper | 2181 | 服务注册中心 |
| MySQL | 3306 | 元数据库 |

---

## 三、部署前准备（所有节点执行）

### 3.1 创建部署用户

**每个节点**都需要执行：

```bash
useradd dolphinscheduler
echo 'dolphinscheduler ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers
passwd dolphinscheduler
```

### 3.2 配置节点间免密 SSH

选择一台管理节点（如 ds-api），生成密钥后分发到所有节点：

```bash
su - dolphinscheduler

# Generate SSH key on management node
ssh-keygen -t rsa -P '' -f ~/.ssh/id_rsa

# Distribute public key to all nodes (including self)
for host in 192.168.1.101 192.168.1.102 192.168.1.103 192.168.1.104 192.168.1.105; do
  ssh-copy-id dolphinscheduler@$host
done

# Verify connectivity
for host in 192.168.1.101 192.168.1.102 192.168.1.103 192.168.1.104 192.168.1.105; do
  ssh $host echo "$host ok"
done
```

### 3.3 解压安装包（所有节点）

```bash
# Execute on all nodes
tar -zxvf apache-dolphinscheduler-2.0.9-bin.tar.gz -C /data/
chown -R dolphinscheduler:dolphinscheduler /data/apache-dolphinscheduler-2.0.9-bin
export DS_HOME=/data/apache-dolphinscheduler-2.0.9-bin
```

### 3.4 放置 MySQL JDBC Driver（所有节点）

```bash
# Execute on all nodes
wget -O $DS_HOME/lib/mysql-connector-java-8.0.28.jar https://repo1.maven.org/maven2/mysql/mysql-connector-java/8.0.28/mysql-connector-java-8.0.28.jar

```

---

## 四、MySQL 初始化（执行一次）

在任意可访问 MySQL 的节点执行一次：

```sql
-- Execute as MySQL root user
CREATE DATABASE dolphinscheduler
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

CREATE USER 'ds_user'@'%' IDENTIFIED BY 'YourPassword123!';
GRANT ALL PRIVILEGES ON dolphinscheduler.* TO 'ds_user'@'%';
FLUSH PRIVILEGES;
```

```bash
mysql -u ds_user -p dolphinscheduler < $DS_HOME/sql/dolphinscheduler_mysql.sql
```

---

## 五、配置文件修改（所有节点相同）

> 以下两个文件内容在所有节点上完全一致，配置好一台后直接 scp 分发即可。

### 5.1 `conf/env/dolphinscheduler_env.sh` ⭐

```bash
# ================================================================
# Required: JDK path (must be consistent across all nodes)
# ================================================================
export JAVA_HOME=/usr/local/jdk1.8.0_311

# ================================================================
# Optional: task engine paths (only configure what you use)
# ================================================================
# export HADOOP_HOME=/opt/soft/hadoop
# export HADOOP_CONF_DIR=/opt/soft/hadoop/etc/hadoop
# export SPARK_HOME1=/opt/soft/spark
# export PYTHON_HOME=/usr/bin/python3
# export HIVE_HOME=/opt/soft/hive
# export FLINK_HOME=/opt/soft/flink
# export DATAX_HOME=/opt/soft/datax

export PATH=$JAVA_HOME/bin:$PATH

# ================================================================
# Database: Spring Boot reads these env vars directly.
# They also override install_config.conf defaults (${VAR:-default}).
# SPRING_DATASOURCE_DRIVER_CLASS_NAME overrides application-mysql.yaml.
# ================================================================
export DATABASE_TYPE="mysql"
export SPRING_DATASOURCE_DRIVER_CLASS_NAME="com.mysql.cj.jdbc.Driver"
export SPRING_DATASOURCE_URL="jdbc:mysql://192.168.1.200:3306/dolphinscheduler?useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=Asia/Shanghai"
export SPRING_DATASOURCE_USERNAME="ds_user"
export SPRING_DATASOURCE_PASSWORD="YourPassword123!"

# ================================================================
# JVM tuning (adjust based on each node's available memory)
# ================================================================
export MASTER_SERVER_OPTS="-Xms2g -Xmx2g -Xmn1g"
export WORKER_SERVER_OPTS="-Xms2g -Xmx2g -Xmn1g"
export API_SERVER_OPTS="-Xms1g -Xmx1g -Xmn512m"
export ALERT_SERVER_OPTS="-Xms512m -Xmx512m -Xmn256m"
export LOGGER_SERVER_OPTS="-Xms512m -Xmx512m -Xmn256m"
```

**JVM 内存参考（按节点总内存）：**

| 服务 | 8 GB | 16 GB | 32 GB |
|------|------|-------|-------|
| Master | `1g/1g/512m` | `2g/2g/1g` | `4g/4g/2g` |
| Worker | `1g/1g/512m` | `2g/2g/1g` | `4g/4g/2g` |
| API | `512m/512m/256m` | `1g/1g/512m` | `2g/2g/1g` |
| Alert/Logger | `256m/256m/128m` | `512m/512m/256m` | `512m/512m/256m` |

---

### 5.2 `conf/registry.properties` ⭐

> ZooKeeper 配置**只从此文件读取**，环境变量对其无效。多节点 ZooKeeper 集群填写所有地址。

```properties
registry.plugin.name=zookeeper
# ZooKeeper cluster addresses (comma-separated)
registry.servers=192.168.1.201:2181,192.168.1.202:2181,192.168.1.203:2181
registry.namespace=dolphinscheduler
registry.base.sleep.time.ms=60
registry.max.sleep.ms=300
registry.max.retries=5
registry.session.timeout.ms=30000
registry.connection.timeout.ms=7500
registry.block.until.connected.wait=600
registry.digest=
```

---

### 5.3 分发配置文件到所有节点

配置好一台后，统一分发：

```bash
# Run on the node where you edited the configs
for host in 192.168.1.101 192.168.1.102 192.168.1.103 192.168.1.104 192.168.1.105; do
  echo "Distributing config to $host ..."
  scp $DS_HOME/conf/env/dolphinscheduler_env.sh  dolphinscheduler@$host:$DS_HOME/conf/env/
  scp $DS_HOME/conf/registry.properties           dolphinscheduler@$host:$DS_HOME/conf/
done
```

---

## 六、各节点启动对应服务

确保 **ZooKeeper 集群和 MySQL 已正常运行**后，按以下顺序在各节点启动服务。

### ds-master-1 / ds-master-2

```bash
su - dolphinscheduler && cd $DS_HOME
sh bin/dolphinscheduler-daemon.sh start master-server
```

### ds-worker-1 / ds-worker-2

```bash
su - dolphinscheduler && cd $DS_HOME
sh bin/dolphinscheduler-daemon.sh start worker-server
sh bin/dolphinscheduler-daemon.sh start logger-server   # must co-locate with worker
```

### ds-api

```bash
su - dolphinscheduler && cd $DS_HOME
sh bin/dolphinscheduler-daemon.sh start api-server
sh bin/dolphinscheduler-daemon.sh start alert-server
```

### 验证各节点状态

```bash
# Run on each node to check its services
for svc in master-server worker-server alert-server api-server logger-server; do
  sh bin/dolphinscheduler-daemon.sh status $svc 2>/dev/null
done

# Check Java processes
jps | grep -E 'MasterServer|WorkerServer|AlertServer|ApiApplicationServer|LoggerServer'
```

### 访问 Web UI

```
http://192.168.1.105:12345/dolphinscheduler/ui
默认账号：admin / dolphinscheduler123
```

登录后在 **监控中心** 可看到所有 Master 和 Worker 节点注册情况。

### 停止服务

```bash
# Run on each node, stop only the services running on that node
sh bin/dolphinscheduler-daemon.sh stop logger-server
sh bin/dolphinscheduler-daemon.sh stop api-server
sh bin/dolphinscheduler-daemon.sh stop alert-server
sh bin/dolphinscheduler-daemon.sh stop worker-server
sh bin/dolphinscheduler-daemon.sh stop master-server
```

---

## 七、配置来源总结

| 配置项 | 写在哪里 | 生效原理 |
|--------|----------|----------|
| `JAVA_HOME` / 工具路径 | `dolphinscheduler_env.sh` | daemon.sh 先 source，shell export |
| `DATABASE_TYPE` | `dolphinscheduler_env.sh` | install_config.conf `${VAR:-default}` 不覆盖 |
| `SPRING_DATASOURCE_*` | `dolphinscheduler_env.sh` | Spring Boot 环境变量松散绑定直接读取 |
| JVM 参数 | `dolphinscheduler_env.sh` | daemon.sh 直接引用 `*_SERVER_OPTS` |
| ZooKeeper 地址 | `conf/registry.properties` | Java `PropertyUtils.loadPropertyFile()` 读文件 |
| **无需修改** | `application-mysql.yaml` | 被 `SPRING_DATASOURCE_*` 环境变量覆盖 |

---

## 八、常见问题排查

```bash
# 1. OOM: reduce JVM heap in dolphinscheduler_env.sh on that node
export MASTER_SERVER_OPTS="-Xms512m -Xmx512m -Xmn256m"

# 2. ZooKeeper connection failed: check registry.properties (not env vars)
for zk in 192.168.1.201 192.168.1.202 192.168.1.203; do
  echo "ruok" | nc $zk 2181   # should return "imok"
done

# 3. Node not registered in Web UI: check ZooKeeper namespace consistency
#    All nodes must have same registry.namespace in registry.properties

# 4. MySQL connection failed: verify JDBC driver on that node
ls $DS_HOME/lib/mysql-connector*.jar

# 5. Task log not visible in UI: ensure LoggerServer is running on worker node
sh bin/dolphinscheduler-daemon.sh status logger-server

# 6. Real-time log monitoring
tail -f $DS_HOME/logs/dolphinscheduler-master-server-$(hostname).out
tail -f $DS_HOME/logs/dolphinscheduler-worker-server-$(hostname).out
tail -f $DS_HOME/logs/dolphinscheduler-api-server-$(hostname).out
```
