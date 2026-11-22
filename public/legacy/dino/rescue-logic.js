/* 공룡 도와주기 — 판정·난이도 규칙 (화면과 분리해서 Vitest 로 시험)
   공룡나라 페이지에서는 window.RescueLogic 으로 씀 */
(function (g) {
  'use strict'

  /* 도구 목록: 아이콘, 이름, 주면 나는 소리 말, 문지르기 가능 */
  var TOOLS = {
    grass: { e: '🌿', n: '풀', fx: '냠냠', snd: 'nyam' },
    leaf: { e: '🍃', n: '나뭇잎', fx: '냠냠', snd: 'nyam' },
    meat: { e: '🍖', n: '고기', fx: '냠냠', snd: 'nyam' },
    fish: { e: '🐟', n: '물고기', fx: '냠냠', snd: 'nyam' },
    water: { e: '💧', n: '깨끗한 물', fx: '꿀꺽', snd: 'gulp' },
    medicine: { e: '💊', n: '약', fx: '꿀꺽', snd: 'gulp' },
    shot: { e: 'shot', n: '장난감 주사', fx: '쏙! 하나도 안 아파~', snd: 'pop' },
    bandage: { e: '🩹', n: '반창고', fx: '반짝 반창고!', snd: 'pop' },
    blanket: { e: '🧣', n: '담요', fx: '포근포근', snd: 'soft', rub: true },
    ointment: { e: '🧴', n: '연고', fx: '쓱쓱', snd: 'rub', rub: true },
    hug: { e: '🤗', n: '안아 주기', fx: '꼬옥', snd: 'soft' },
    scissors: { e: '✂️', n: '가위', fx: '싹둑', snd: 'pop' }
  }
  /* 아이 몸 상태에 따라 레벨 5에서 함께 필요한 먹이 */
  var FOOD_BY_DIET = { plant: 'grass', meat: 'meat', fish: 'fish', omni: 'grass' }

  /** 주사 끄기: 정답에 주사가 있으면 약으로 */
  function friendTools(f, opts) {
    var t = (f.tools || []).slice()
    if (opts && opts.noShot) t = t.filter(function (x) { return x !== 'shot' })
    if (!t.length) t = ['medicine']
    return t
  }

  /** 알맞은 도구인지 (tools 중 아무거나 정답) */
  function isRight(f, toolId, opts) { return friendTools(f, opts).indexOf(toolId) >= 0 }

  /** 두 번 맞지 않으면 정답 도구를 흔들어 알려 줌 */
  function needHint(wrongInRow) { return wrongInRow >= 2 }

  /** 형 모드 레벨별 도구 개수 / 말풍선 보임 */
  var TOOL_COUNT = [2, 2, 3, 4, 4]
  function toolCount(level) { return TOOL_COUNT[Math.max(1, Math.min(5, level)) - 1] }
  function bubbleShown(mode, level) { return mode === 'dong' || level <= 3 }

  /** 필요한 것 목록. 레벨 5에서 아프거나 다친 친구는 먹이도 함께 (예: 약 + 고기) */
  function needs(f, mode, level, diet, opts) {
    var first = friendTools(f, opts)
    var list = [first]
    if (mode === 'hyeong' && level >= 5 && (f.action === 'heal' || f.action === 'rub')) {
      var food = FOOD_BY_DIET[diet] || 'grass'
      if (first.indexOf(food) < 0) list.push([food])
    }
    return list
  }

  /** 보여 줄 도구: 정답(들) + 다른 도구로 개수 채우기. rnd 는 0~1 난수 함수 */
  function toolChoices(needList, mode, level, opts, rnd) {
    rnd = rnd || Math.random
    var right = needList.map(function (n) { return n[0] })
    if (mode === 'dong') return right.slice(0, 1)
    var n = Math.max(toolCount(level), right.length + 1)
    var pool = Object.keys(TOOLS).filter(function (k) {
      if (right.indexOf(k) >= 0) return false
      if (opts && opts.noShot && k === 'shot') return false
      return !needList.some(function (x) { return x.indexOf(k) >= 0 })
    })
    var out = right.slice()
    while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0])
    for (var i = out.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = out[i]; out[i] = out[j]; out[j] = t }
    return out
  }

  /** 한 판 친구 고르기: 모드에 맞고, 꺼 둔 친구 빼고, 겹치지 않게 */
  function pickFriends(list, mode, n, off, rnd) {
    rnd = rnd || Math.random
    var pool = list.filter(function (f) { return (f.modes || ['dong', 'hyeong']).indexOf(mode) >= 0 && (off || []).indexOf(f.id) < 0 })
    if (!pool.length) pool = list.filter(function (f) { return (f.modes || ['dong', 'hyeong']).indexOf(mode) >= 0 })
    var out = [], p = pool.slice()
    while (out.length < n && p.length) out.push(p.splice(Math.floor(rnd() * p.length), 1)[0])
    return out
  }

  /** 아이별 레벨 (형 모드만 1~5 자동, 동생 모드는 항상 1). firstTry: 이번 판 친구마다 첫 시도에 맞혔는지 */
  function nextLevel(state, who, firstTry) {
    var s = JSON.parse(JSON.stringify(state || {}))
    if (who !== 'hyeong') return s
    var cur = s.hyeong || { lvl: 1, plays: 0, ok: 0, tries: 0 }
    cur.plays = (cur.plays || 0) + 1
    var ok = firstTry.filter(Boolean).length
    cur.ok = (cur.ok || 0) + ok
    cur.tries = (cur.tries || 0) + firstTry.length
    var rate = firstTry.length ? ok / firstTry.length : 0
    if (rate >= 0.8 && cur.lvl < 5) cur.lvl++
    else if (rate < 0.5 && cur.lvl > 1) cur.lvl--
    s.hyeong = cur
    return s
  }
  function levelOf(state, who) { return who === 'hyeong' ? ((state && state.hyeong && state.hyeong.lvl) || 1) : 1 }

  /** rescue.json 읽기 (빠진 값은 기본값, 이상한 항목은 뺌) */
  function parseRescue(json) {
    var o = typeof json === 'string' ? JSON.parse(json) : json
    var worlds = ['grassland', 'forest', 'sea', 'volcano', 'sky']
    return (o && o.friends || []).filter(function (f) {
      return f && f.id && worlds.indexOf(f.world) >= 0 && Array.isArray(f.tools) && f.tools.length && f.tools.every(function (t) { return TOOLS[t] })
    }).map(function (f) {
      return Object.assign({ action: 'feed', modes: ['dong', 'hyeong'], intro: '', needSay: '', hint: '', thanks: '고마워, {이름}! 이제 힘이 나!' }, f)
    })
  }

  g.RescueLogic = { TOOLS: TOOLS, friendTools: friendTools, isRight: isRight, needHint: needHint, toolCount: toolCount, bubbleShown: bubbleShown, needs: needs, toolChoices: toolChoices, pickFriends: pickFriends, nextLevel: nextLevel, levelOf: levelOf, parseRescue: parseRescue }
})(typeof window !== 'undefined' ? window : globalThis)
