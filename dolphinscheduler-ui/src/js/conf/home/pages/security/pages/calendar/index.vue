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
  <m-list-construction :title="$t('Calendar manage')">
    <template slot="conditions">
      <m-conditions @on-conditions="_onConditions">
        <template slot="button-group">
          <el-button size="mini" @click="_create(null)">{{$t('Create calendar')}}</el-button>
          <el-dialog
            :title="currentItem ? $t('Edit calendar') : $t('Create calendar')"
            v-if="calendarDialogVisible"
            :visible.sync="calendarDialogVisible"
            width="auto">
            <m-create-calendar
              :item="currentItem"
              @onUpdate="onUpdate"
              @close="close">
            </m-create-calendar>
          </el-dialog>
        </template>
      </m-conditions>
    </template>
    <template slot="content">
      <template v-if="calendarList.length || total > 0">
        <m-list
          @on-edit="_onEdit"
          @on-delete="_onDelete"
          :calendar-list="calendarList"
          :page-no="searchParams.pageNo"
          :page-size="searchParams.pageSize">
        </m-list>
        <div class="page-box">
          <el-pagination
            background
            @current-change="_page"
            @size-change="_pageSize"
            :page-size="searchParams.pageSize"
            :current-page.sync="searchParams.pageNo"
            :page-sizes="[10, 30, 50]"
            layout="sizes, prev, pager, next, jumper"
            :total="total">
          </el-pagination>
        </div>
      </template>
      <template v-if="!calendarList.length && total <= 0">
        <m-no-data></m-no-data>
      </template>
      <m-spin :is-spin="isLoading" :is-left="isLeft"></m-spin>
    </template>
  </m-list-construction>
</template>
<script>
  import _ from 'lodash'
  import mList from './_source/list'
  import mSpin from '@/module/components/spin/spin'
  import mCreateCalendar from './_source/createCalendar'
  import mNoData from '@/module/components/noData/noData'
  import listUrlParamHandle from '@/module/mixin/listUrlParamHandle'
  import mConditions from '@/module/components/conditions/conditions'
  import mListConstruction from '@/module/components/listConstruction/listConstruction'
  import { calendarStore } from './_source/calendarStore'

  export default {
    name: 'calendar-index',
    data () {
      return {
        total: null,
        isLoading: true,
        calendarList: [],
        searchParams: {
          pageSize: 10,
          pageNo: 1,
          searchVal: ''
        },
        isLeft: true,
        calendarDialogVisible: false,
        currentItem: null
      }
    },
    mixins: [listUrlParamHandle],
    props: {},
    methods: {
      _onConditions (o) {
        this.searchParams = _.assign(this.searchParams, o)
        this.searchParams.pageNo = 1
      },
      _page (val) {
        this.searchParams.pageNo = val
      },
      _pageSize (val) {
        this.searchParams.pageSize = val
      },
      _onEdit (item) {
        this._create(item)
      },
      _onDelete () {
        this._debounceGET('false')
      },
      _create (item) {
        this.currentItem = item || null
        this.calendarDialogVisible = true
      },
      onUpdate () {
        this.calendarDialogVisible = false
        this._debounceGET('false')
      },
      close () {
        this.calendarDialogVisible = false
      },
      _getList (flag) {
        if (sessionStorage.getItem('isLeft') === '0') {
          this.isLeft = false
        } else {
          this.isLeft = true
        }
        this.isLoading = !flag
        try {
          const result = calendarStore.getPage(
            this.searchParams.pageNo,
            this.searchParams.pageSize,
            this.searchParams.searchVal
          )
          if (this.searchParams.pageNo > 1 && result.list.length === 0) {
            this.searchParams.pageNo = this.searchParams.pageNo - 1
          } else {
            this.calendarList = result.list
            this.total = result.total
          }
        } finally {
          this.isLoading = false
        }
      }
    },
    watch: {
      '$route' (a) {
        this.searchParams.pageNo = _.isEmpty(a.query) ? 1 : a.query.pageNo
      }
    },
    created () {},
    mounted () {},
    beforeDestroy () {
      sessionStorage.setItem('isLeft', 1)
    },
    components: { mList, mListConstruction, mConditions, mSpin, mNoData, mCreateCalendar }
  }
</script>
