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
      <div class="create-card-model">
        <!-- Card Name: disabled when editing value only -->
        <m-list-box-f>
          <template slot="name"><strong>*</strong>{{$t('Card Name')}}</template>
          <template slot="content">
            <el-input
              v-model="cardName"
              maxlength="100"
              size="mini"
              :disabled="statusRef === 2"
              :placeholder="$t('Please enter card name')"
              autocomplete="off">
            </el-input>
          </template>
        </m-list-box-f>

        <!-- Description: hidden when editing value -->
        <m-list-box-f v-if="statusRef !== 2">
          <template slot="name">{{$t('Description')}}</template>
          <template slot="content">
            <el-input
              type="textarea"
              v-model="description"
              :placeholder="$t('Please enter description')"
              :rows="2">
            </el-input>
          </template>
        </m-list-box-f>

        <!-- Calendar: hidden when editing value -->
        <m-list-box-f v-if="statusRef !== 2">
          <template slot="name">{{$t('Calendar')}}</template>
          <template slot="content">
            <el-select v-model="calendarCode" size="mini" style="width: 100%;" clearable>
              <el-option
                v-for="cal in calendarOptions"
                :key="cal.id"
                :value="cal.id"
                :label="cal.name">
              </el-option>
            </el-select>
          </template>
        </m-list-box-f>

        <!-- Card Value: disabled when editing info, editable when editing value -->
        <m-list-box-f>
          <template slot="name"><strong>*</strong>{{$t('Card Value')}}</template>
          <template slot="content">
            <el-input
              v-model="cardValueStr"
              size="mini"
              :disabled="statusRef === 1"
              :placeholder="$t('Card value placeholder')"
              autocomplete="off">
            </el-input>
            <div class="field-tip">{{$t('Card value tip')}}</div>
          </template>
        </m-list-box-f>

        <!-- Config fields: hidden when editing value -->
        <template v-if="statusRef !== 2">
          <m-list-box-f>
            <template slot="name"><strong>*</strong>{{$t('Flop Direction')}}</template>
            <template slot="content">
              <el-select v-model="flopDirection" size="mini" style="width: 100%;">
                <el-option :value="0" :label="$t('Forward')"></el-option>
                <el-option :value="1" :label="$t('Backward')"></el-option>
              </el-select>
            </template>
          </m-list-box-f>
          <m-list-box-f>
            <template slot="name">{{$t('Day Step')}}</template>
            <template slot="content">
              <el-input
                v-model="dayStep"
                size="mini"
                :placeholder="$t('Please enter day step')"
                autocomplete="off">
              </el-input>
            </template>
          </m-list-box-f>
          <m-list-box-f>
            <template slot="name">{{$t('Hour Step')}}</template>
            <template slot="content">
              <el-input
                v-model="hourStep"
                size="mini"
                :placeholder="$t('Please enter hour step')"
                autocomplete="off">
              </el-input>
            </template>
          </m-list-box-f>
          <m-list-box-f>
            <template slot="name">{{$t('Minute Step')}}</template>
            <template slot="content">
              <el-input
                v-model="minuteStep"
                size="mini"
                :placeholder="$t('Please enter minute step')"
                autocomplete="off">
              </el-input>
            </template>
          </m-list-box-f>
          <m-list-box-f>
            <template slot="name"><strong>*</strong>{{$t('Output Format')}}</template>
            <template slot="content">
              <el-select v-model="outputFormat" size="mini" style="width: 100%;">
                <el-option value="yyyyMMdd" label="yyyyMMdd"></el-option>
                <el-option value="yyyy-MM-dd" label="yyyy-MM-dd"></el-option>
                <el-option value="yyyy-MM-dd HH:mm:ss" label="yyyy-MM-dd HH:mm:ss"></el-option>
              </el-select>
            </template>
          </m-list-box-f>
        </template>
      </div>
    </template>
  </m-popover>
</template>
<script>
  import i18n from '@/module/i18n'
  import mPopover from '@/module/components/popup/popover'
  import mListBoxF from '@/module/components/listBoxF/listBoxF'
  import { cardStore } from './cardStore'
  import { calendarStore } from '../../calendar/_source/calendarStore'

  export default {
    name: 'create-card',
    data () {
      return {
        cardName: '',
        description: '',
        calendarCode: null,
        cardValueStr: '',
        flopDirection: 0,
        dayStep: 0,
        hourStep: 0,
        minuteStep: 0,
        outputFormat: 'yyyy-MM-dd',
        calendarOptions: []
      }
    },
    props: {
      item: Object,
      // 0 = create, 1 = edit info, 2 = edit value
      statusRef: {
        type: Number,
        default: 0
      }
    },
    computed: {
      _modalTitle () {
        if (this.statusRef === 2) return i18n.$t('Edit card value')
        return this.item ? i18n.$t('Edit card') : i18n.$t('Create card')
      }
    },
    methods: {
      _ok () {
        if (!this._verification()) return

        try {
          if (this.statusRef === 2) {
            const ts = new Date(this.cardValueStr).getTime()
            cardStore.updateValue(this.item.id, isNaN(ts) ? Date.now() : ts)
            this.$message.success(i18n.$t('Update success'))
          } else {
            const calObj = this.calendarOptions.find(c => c.id === this.calendarCode)
            const data = {
              cardName: this.cardName.trim(),
              description: this.description.trim(),
              calendarCode: this.calendarCode,
              calendarName: calObj ? calObj.name : '',
              cardValue: this.item ? this.item.cardValue : Date.now(),
              flopDirection: this.flopDirection,
              dayStep: parseInt(this.dayStep) || 0,
              hourStep: parseInt(this.hourStep) || 0,
              minuteStep: parseInt(this.minuteStep) || 0,
              outputFormat: this.outputFormat
            }
            if (this.item) {
              cardStore.update(this.item.id, data)
              this.$message.success(i18n.$t('Update success'))
            } else {
              cardStore.create(data)
              this.$message.success(i18n.$t('Create success'))
            }
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
        if (this.statusRef !== 2 && !this.cardName.replace(/\s*/g, '')) {
          this.$message.warning(i18n.$t('Please enter card name'))
          return false
        }
        if (this.statusRef !== 1 && !this.cardValueStr.trim()) {
          this.$message.warning(i18n.$t('Please enter card value'))
          return false
        }
        return true
      }
    },
    watch: {},
    created () {
      this.calendarOptions = calendarStore.getAll()

      if (this.item) {
        this.cardName = this.item.cardName || ''
        this.description = this.item.description || ''
        this.calendarCode = this.item.calendarCode || null
        this.flopDirection = this.item.flopDirection !== undefined ? this.item.flopDirection : 0
        this.dayStep = this.item.dayStep || 0
        this.hourStep = this.item.hourStep || 0
        this.minuteStep = this.item.minuteStep || 0
        this.outputFormat = this.item.outputFormat || 'yyyy-MM-dd'
        if (this.item.cardValue) {
          try {
            const d = new Date(this.item.cardValue)
            this.cardValueStr = isNaN(d.getTime()) ? String(this.item.cardValue) : d.toISOString().slice(0, 10)
          } catch (e) {
            this.cardValueStr = String(this.item.cardValue)
          }
        }
      } else {
        this.cardValueStr = new Date().toISOString().slice(0, 10)
      }
    },
    mounted () {},
    components: { mPopover, mListBoxF }
  }
</script>
<style lang="scss" scoped>
  .field-tip {
    font-size: 11px;
    color: #999;
    margin-top: 2px;
  }
</style>
