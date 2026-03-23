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

const STORAGE_KEY = 'ds_calendar_list'

function load () {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch (e) {
    return []
  }
}

function save (list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function nextId (list) {
  return list.length > 0 ? Math.max(...list.map(i => i.id)) + 1 : 1
}

export const calendarStore = {
  getAll () {
    return load()
  },

  getPage (pageNo, pageSize, searchVal) {
    let list = load()
    if (searchVal) {
      const kw = searchVal.toLowerCase()
      list = list.filter(item => item.name && item.name.toLowerCase().includes(kw))
    }
    const total = list.length
    const start = (pageNo - 1) * pageSize
    return { list: list.slice(start, start + pageSize), total }
  },

  create (data) {
    const list = load()
    const now = new Date().toISOString()
    const record = {
      id: nextId(list),
      name: data.name,
      type: data.type || 'EXECUTE',
      description: data.description || '',
      dateList: data.dateList || [],
      createTime: now,
      updateTime: now
    }
    list.push(record)
    save(list)
    return record
  },

  update (id, data) {
    const list = load()
    const idx = list.findIndex(i => i.id === id)
    if (idx === -1) return null
    const now = new Date().toISOString()
    list[idx] = Object.assign({}, list[idx], {
      name: data.name,
      type: data.type,
      description: data.description || '',
      dateList: data.dateList || [],
      updateTime: now
    })
    save(list)
    return list[idx]
  },

  delete (id) {
    const list = load()
    const idx = list.findIndex(i => i.id === id)
    if (idx === -1) return false
    list.splice(idx, 1)
    save(list)
    return true
  },

  getById (id) {
    return load().find(i => i.id === id) || null
  }
}
