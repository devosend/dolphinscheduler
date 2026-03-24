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
  <m-popover
    ref="popup"
    :ok-text="item ? $t('Edit') : $t('Submit')"
    @ok="_ok"
    @close="$emit('close')">
    <template slot="content">
      <div class="create-calendar-model">
        <m-list-box-f>
          <template slot="name"><strong>*</strong>{{$t('Name')}}</template>
          <template slot="content">
            <el-input
              v-model="name"
              maxlength="100"
              size="mini"
              :placeholder="$t('Please enter name')"
              autocomplete="off">
            </el-input>
          </template>
        </m-list-box-f>
        <m-list-box-f>
          <template slot="name"><strong>*</strong>{{$t('Calendar Type')}}</template>
          <template slot="content">
            <el-select v-model="type" size="mini" style="width: 100%;">
              <el-option value="EXECUTE" :label="$t('Execute Day')"></el-option>
              <el-option value="NOT_EXECUTE" :label="$t('Non-Execute Day')"></el-option>
            </el-select>
          </template>
        </m-list-box-f>
        <m-list-box-f>
          <template slot="name">{{$t('Description')}}</template>
          <template slot="content">
            <el-input
              type="textarea"
              v-model="description"
              :placeholder="$t('Please enter description')"
              :rows="3">
            </el-input>
          </template>
        </m-list-box-f>
        <m-list-box-f>
          <template slot="name">{{$t('Date List')}}</template>
          <template slot="content">
            <div class="date-list-box">
              <div class="date-input-row">
                <el-input
                  v-model="dateInput"
                  :placeholder="$t('Date input placeholder')"
                  size="mini"
                  autocomplete="off"
                  style="width: 300px;"
                  @keyup.enter.native="_addDate">
                </el-input>
                <el-button type="primary" size="mini" @click="_addDate" style="margin-left: 8px;">
                  {{$t('Add date')}}
                </el-button>
              </div>
              <div class="date-tags" v-if="dateList.length > 0">
                <span
                  v-for="(d, idx) in dateList"
                  :key="idx"
                  class="date-tag">
                  {{d}}
                  <i class="el-icon-close date-tag-remove" @click="_removeDate(idx)"></i>
                </span>
              </div>
              <div v-else class="date-empty">{{$t('No dates added')}}</div>
            </div>
          </template>
        </m-list-box-f>
      </div>
    </template>
  </m-popover>
</template>
<script>
  import i18n from '@/module/i18n'
  import mPopover from '@/module/components/popup/popover'
  import mListBoxF from '@/module/components/listBoxF/listBoxF'
  import { calendarStore } from './calendarStore'

  const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

  export default {
    name: 'create-calendar',
    data () {
      return {
        name: '',
        type: 'EXECUTE',
        description: '',
        dateList: [],
        dateInput: ''
      }
    },
    props: {
      item: Object
    },
    methods: {
      _ok () {
        if (!this._verification()) return

        const data = {
          name: this.name.trim(),
          type: this.type,
          description: this.description.trim(),
          dateList: this.dateList.slice()
        }

        try {
          if (this.item) {
            calendarStore.update(this.item.id, data)
            this.$message.success(i18n.$t('Update success'))
          } else {
            calendarStore.create(data)
            this.$message.success(i18n.$t('Create success'))
          }
          setTimeout(() => {
            this.$refs.popup.spinnerLoading = false
          }, 400)
          this.$emit('onUpdate')
        } catch (e) {
          this.$message.error(e.message || i18n.$t('Operation failed'))
          this.$refs.popup.spinnerLoading = false
        }
      },
      _verification () {
        if (!this.name.replace(/\s*/g, '')) {
          this.$message.warning(i18n.$t('Please enter name'))
          return false
        }
        return true
      },
      _addDate () {
        const raw = this.dateInput.trim()
        if (!raw) {
          this.$message.warning(i18n.$t('Please enter date'))
          return
        }
        // Split by comma or Chinese comma, filter empty tokens
        const tokens = raw.split(/[,，]/).map(s => s.trim()).filter(s => s.length > 0)
        const invalid = []
        const duplicate = []
        const added = []
        tokens.forEach(d => {
          if (!DATE_PATTERN.test(d)) {
            invalid.push(d)
          } else if (this.dateList.includes(d)) {
            duplicate.push(d)
          } else {
            this.dateList.push(d)
            added.push(d)
          }
        })
        if (invalid.length > 0) {
          this.$message.warning(`${i18n.$t('Date format invalid')}: ${invalid.join(', ')}`)
        } else if (added.length === 0 && duplicate.length > 0) {
          this.$message.warning(i18n.$t('Date already added'))
        } else if (added.length > 0) {
          this.dateInput = ''
        }
      },
      _removeDate (idx) {
        this.dateList.splice(idx, 1)
      }
    },
    watch: {},
    created () {
      if (this.item) {
        this.name = this.item.name
        this.type = this.item.type || 'EXECUTE'
        this.description = this.item.description || ''
        this.dateList = (this.item.dateList || []).slice()
      }
    },
    mounted () {},
    components: { mPopover, mListBoxF }
  }
</script>
<style lang="scss" scoped>
  .date-list-box {
    .date-input-row {
      display: flex;
      align-items: center;
    }
    .date-tags {
      margin-top: 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .date-tag {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      background: #e3f2fd;
      border-radius: 12px;
      font-size: 12px;
      color: #1565c0;
      .date-tag-remove {
        margin-left: 4px;
        cursor: pointer;
        font-size: 10px;
        &:hover { color: #c62828; }
      }
    }
    .date-empty {
      margin-top: 8px;
      color: #999;
      font-size: 12px;
    }
  }
</style>
