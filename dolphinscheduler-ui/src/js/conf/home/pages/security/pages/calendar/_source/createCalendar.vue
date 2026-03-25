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
  <m-popup
    ref="popup"
    :ok-text="item ? $t('Edit') : $t('Submit')"
    :nameText="item ? $t('Edit calendar') : $t('Create calendar')"
    @ok="_ok">
    <template slot="content">
      <div class="create-calendar-model">
        <m-list-box-f>
          <template slot="name"><strong>*</strong>{{$t('Name')}}</template>
          <template slot="content">
            <x-input
              type="input"
              v-model="name"
              maxlength="100"
              :placeholder="$t('Please enter name')"
              autocomplete="off">
            </x-input>
          </template>
        </m-list-box-f>
        <m-list-box-f>
          <template slot="name"><strong>*</strong>{{$t('Calendar Type')}}</template>
          <template slot="content">
            <x-select v-model="type" style="width: 100%;">
              <x-option value="EXECUTE" :label="$t('Execute Day')"></x-option>
              <x-option value="NOT_EXECUTE" :label="$t('Non-Execute Day')"></x-option>
            </x-select>
          </template>
        </m-list-box-f>
        <m-list-box-f>
          <template slot="name">{{$t('Description')}}</template>
          <template slot="content">
            <x-input
              type="textarea"
              v-model="description"
              :placeholder="$t('Please enter description')"
              :rows="3">
            </x-input>
          </template>
        </m-list-box-f>
        <m-list-box-f>
          <template slot="name">{{$t('Date List')}}</template>
          <template slot="content">
            <div class="date-list-box">
              <div class="date-input-row">
                <x-input
                  type="input"
                  v-model="dateInput"
                  :placeholder="$t('Date input placeholder')"
                  autocomplete="off"
                  style="width: 180px;">
                </x-input>
                <x-button type="ghost" size="small" @click="_addDate" style="margin-left: 8px;">
                  {{$t('Add date')}}
                </x-button>
              </div>
              <div class="date-tags" v-if="dateList.length > 0">
                <span
                  v-for="(d, idx) in dateList"
                  :key="idx"
                  class="date-tag">
                  {{d}}
                  <i class="ans-icon-close date-tag-remove" @click="_removeDate(idx)"></i>
                </span>
              </div>
              <div v-else class="date-empty">{{$t('No dates added')}}</div>
            </div>
          </template>
        </m-list-box-f>
      </div>
    </template>
  </m-popup>
</template>
<script>
  import i18n from '@/module/i18n'
  import mPopup from '@/module/components/popup/popup'
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
            this.$refs['popup'].spinnerLoading = false
          }, 400)
          this.$emit('onUpdate')
        } catch (e) {
          this.$message.error(e.message || i18n.$t('Operation failed'))
          this.$refs['popup'].spinnerLoading = false
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
        // Support comma-separated multiple dates
        const inputs = raw.split(',').map(s => s.trim()).filter(s => s.length > 0)
        const invalidDates = []
        const toAdd = []

        inputs.forEach(d => {
          if (!DATE_PATTERN.test(d)) {
            invalidDates.push(d)
          } else if (!this.dateList.includes(d)) {
            toAdd.push(d)
          }
          // silently skip duplicates already in the list
        })

        if (invalidDates.length > 0) {
          this.$message.warning(i18n.$t('Date format invalid') + ': ' + invalidDates.join(', '))
        }

        if (toAdd.length > 0) {
          this.dateList.push(...toAdd)
          // Only clear input when all entries are valid
          if (invalidDates.length === 0) {
            this.dateInput = ''
          }
        } else if (invalidDates.length === 0) {
          // All inputs were duplicates
          this.$message.warning(i18n.$t('Date already added'))
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
    components: { mPopup, mListBoxF }
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
