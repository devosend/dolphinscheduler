/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
<template>
  <div class="list-model">
    <div class="table-box">
      <el-table :data="list" size="mini" style="width: 100%">
        <el-table-column type="index" :label="$t('#')" width="50" :index="indexMethod"></el-table-column>
        <el-table-column prop="name" :label="$t('Name')" min-width="120"></el-table-column>
        <el-table-column :label="$t('Calendar Type')" width="110">
          <template slot-scope="scope">
            <span :class="scope.row.type === 'EXECUTE' ? 'tag-execute' : 'tag-not-execute'">
              {{scope.row.type === 'EXECUTE' ? $t('Execute Day') : $t('Non-Execute Day')}}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="description" :label="$t('Description')" min-width="120">
          <template slot-scope="scope">{{scope.row.description || '-'}}</template>
        </el-table-column>
        <el-table-column :label="$t('Date Count')" width="90">
          <template slot-scope="scope">{{scope.row.dateList ? scope.row.dateList.length : 0}}</template>
        </el-table-column>
        <el-table-column :label="$t('Create Time')" min-width="135">
          <template slot-scope="scope">
            <span v-if="scope.row.createTime">{{scope.row.createTime | formatDate}}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('Update Time')" min-width="135">
          <template slot-scope="scope">
            <span v-if="scope.row.updateTime">{{scope.row.updateTime | formatDate}}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('Operation')" width="100">
          <template slot-scope="scope">
            <el-tooltip :content="$t('Edit')" placement="top">
              <el-button type="primary" size="mini" icon="el-icon-edit-outline" @click="_edit(scope.row)" circle></el-button>
            </el-tooltip>
            <el-tooltip :content="$t('Delete')" placement="top">
              <el-button type="danger" size="mini" icon="el-icon-delete" @click="_delete(scope.row)" circle></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
<script>
  import { calendarStore } from './calendarStore'

  export default {
    name: 'calendar-list',
    data () {
      return {
        list: []
      }
    },
    props: {
      calendarList: Array,
      pageNo: Number,
      pageSize: Number
    },
    methods: {
      indexMethod (index) {
        return (this.pageNo - 1) * this.pageSize + index + 1
      },
      _delete (item) {
        this.$confirm(this.$t('Delete?'), '', {
          confirmButtonText: this.$t('Confirm'),
          cancelButtonText: this.$t('Cancel'),
          type: 'warning'
        }).then(() => {
          calendarStore.delete(item.id)
          this.$message.success(this.$t('Delete success'))
          this.$emit('on-delete')
        }).catch(() => {})
      },
      _edit (item) {
        this.$emit('on-edit', item)
      }
    },
    watch: {
      calendarList (a) {
        this.list = []
        setTimeout(() => {
          this.list = a
        })
      }
    },
    created () {
      this.list = this.calendarList
    },
    mounted () {},
    components: {}
  }
</script>
<style lang="scss" scoped>
  .tag-execute {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 3px;
    background: #e8f5e9;
    color: #388e3c;
    font-size: 12px;
  }
  .tag-not-execute {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 3px;
    background: #fce4ec;
    color: #c62828;
    font-size: 12px;
  }
</style>
