<template>
  <form class="input-group mb-3" @submit.prevent="onSubmit">
    <label class="input-group-prepend" for="inlineFormCustomSelectPref">
      <span class="input-group-text">{{pinyin}}</span>
    </label>
    <input
      type="text"
      class="form-control mb-2 mr-sm-2"
      placeholder="請輸入起始時間  e.g. 11:12.3"
      v-model="startSecStr"
    />
    <button type="submit" class="btn btn-dark mb-2" :disabled="saying">調整單字時間</button>
    <button
      type="button"
      class="btn btn-dark mb-2 ml-1"
      :disabled="saying  || !shouldReport || reported"
      @click.prevent="report"
    >{{reported ? '完成回報': '回報更新' }}</button>
  </form>
</template>
<script>
export default {
  props: ["pinyin", "startSec", "duration", "saying"],
  data() {
    return {
      tSec: 0,
      shouldReport: false,
      reported: false
    };
  },
  computed: {
    startSecStr: {
      get() {
        return this.startSec
          ? `${Math.floor(this.startSec / 60)}:${Math.round(
              (this.startSec % 60) * 10
            ) / 10}`
          : "";
      },
      set(val) {
        const tss = val.split(":");
        const minute = parseInt(tss[0]);
        const seconds = parseFloat(tss[1]);
        this.tSec = minute * 60 + seconds;
      }
    }
  },
  methods: {
    onSubmit() {
      this.$emit("submit", {
        pinyin: this.pinyin,
        startSec: this.tSec,
        duration: this.duration
      });
      this.shouldReport = true;
      this.reported = false;
    },
    async report() {
      await fetch("/api/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=utf-8"
        },
        body: JSON.stringify({
          pinyin: this.pinyin,
          startSec: this.tSec,
          duration: this.duration
        })
      });
      this.reported = true;
    }
  },
  mounted() {
    this.tSec = this.startSec;
  }
};
</script>