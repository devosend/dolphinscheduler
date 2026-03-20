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
      <table>
        <tr>
          <th><span>{{$t('#')}}</span></th>
          <th><span>{{$t('Name')}}</span></th>
          <th><span>{{$t('Calendar Type')}}</span></th>
          <th><span>{{$t('Description')}}</span></th>
          <th><span>{{$t('Date Count')}}</span></th>
          <th><span>{{$t('Create Time')}}</span></th>
          <th><span>{{$t('Update Time')}}</span></th>
          <th scope="col" width="100"><span>{{$t('Operation')}}</span></th>
        </tr>
        <tr v-for="(item, $index) in list" :key="item.id">
          <td>
            <span>{{parseInt(pageNo === 1 ? ($index + 1) : (($index + 1) + (pageSize * (pageNo - 1))))}}</span>
          </td>
          <td><span>{{item.name}}</span></td>
          <td>
            <span :class="item.type === 'EXECUTE' ? 'tag-execute' : 'tag-not-execute'">
              {{item.type === 'EXECUTE' ? $t('Execute Day') : $t('Non-Execute Day')}}
            </span>
          </td>
          <td><span>{{item.description || '-'}}</span></td>
          <td><span>{{item.dateList ? item.dateList.length : 0}}</span></td>
          <td>
            <span v-if="item.createTime">{{item.createTime | formatDate}}</span>
            <span v-else>-</span>
          </td>
          <td>
            <span v-if="item.updateTime">{{item.updateTime | formatDate}}</span>
            <span v-else>-</span>
          </td>
          <td>
            <x-button
              type="info"
              shape="circle"
              size="xsmall"
              data-toggle="tooltip"
              :title="$t('Edit')"
              @click="_edit(item)"
              icon="ans-icon-edit">
            </x-button>
            <x-poptip
              :ref="'poptip-' + $index"
              placement="bottom-end"
              width="90">
              <p>{{$t('Delete?')}}</p>
              <div style="text-align: right; margin: 0; padding-top: 4px;">
                <x-button type="text" size="xsmall" shape="circle" @click="_closeDelete($index)">{{$t('Cancel')}}</x-button>
                <x-button type="primary" size="xsmall" shape="circle" @click="_delete(item, $index)">{{$t('Confirm')}}</x-button>
              </div>
              <template slot="reference">
                <x-button
                  type="error"
                  shape="circle"
                  size="xsmall"
                  data-toggle="tooltip"
                  :title="$t('delete')"
                  icon="ans-icon-trash">
                </x-button>
              </template>
            </x-poptip>
          </td>
        </tr>
      </table>
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
      _closeDelete (i) {
        this.$refs[`poptip-${i}`][0].doClose()
      },
      _delete (item, i) {
        calendarStore.delete(item.id)
        this.$refs[`poptip-${i}`][0].doClose()
        this.$message.success(this.$t('Delete success'))
        this.$emit('on-delete')
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
