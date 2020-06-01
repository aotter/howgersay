<template>
  <section class="howger">
    <div class="container">
      <div class="row">
        <div class="col text-center p-3">
          <h2>HowfunSong - 昊哥幫你念</h2>
          <h6 class="text-secondary">好放送，放送昊哥好祝福</h6>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="container">
        <div class="d-flex justify-content-between text-center">
          <div style="margin: 0 auto;">
            <div id="ytplayer"></div>
          </div>
        </div>
        <div class="col text-center">
          <form @submit.prevent="onSubmit">
            <div class="form-group">
              <label for="zh">在下方文字框中輸入中文，讓昊哥幫你念 (第一次唸會卡卡，多念幾次就順了）</label>
              <textarea class="form-control" id="zh" rows="3" v-model="zh"></textarea>
            </div>
            <button type="submit" class="btn btn-primary btn-block mb-2">請朗讀</button>
          </form>
        </div>
      </div>
    </div>
    <div v-if="positions.length > 0" class="row mt-4">
      <div class="container">
        <div class="col text-center">
          <small>聽起來怪怪的？請幫我們輸入更精確的時間（秒可以有小數點呦！）</small>
          <span v-for="(p, i) in positions" :key="i">
            <WordPositionInput
              :pinyin="p.pinyin"
              :start-sec="p.startSec"
              :duration="p.duration"
              @submit="onUpdate"
            />
          </span>
        </div>
      </div>
    </div>
    <hr />
    <div class="text-center text-secondary">
      <small>假日不想寫作業一時興起的產物，博君一笑便民服務，影片屬How哥所有。</small>
    </div>
  </section>
</template>

<script>
const tag = document.createElement("script");
tag.src = "https://www.youtube.com/player_api";
const firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

const VIDEO_ID = "sNcvgpUqrwE";

let player;
window.onYouTubePlayerAPIReady = () => {
  player = new YT.Player("ytplayer", {
    width: 360,
    height: 240,
    videoId: VIDEO_ID
  });
};
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default {
  components: {
    WordPositionInput: () => import("~/components/WordPositionInput")
  },
  data() {
    return {
      zh: "",
      positions: []
    };
  },
  computed: {
    jsonData() {
      return JSON.stringify(this.wordData);
    }
  },
  methods: {
    formatMinSec(input) {
      return `${Math.floor(input / 60)}:${Math.round((input % 60) * 10) / 10}`;
    },
    async onUpdate({ pinyin, startSec, duration }) {
      this.positions = this.positions.map(p => {
        if (p.pinyin === pinyin) {
          p.startSec = startSec;
          p.duration = duration;
        }
        return p;
      });
      await fetch("/api/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=utf-8"
        },
        body: JSON.stringify({ pinyin, startSec, duration })
      });
      await this.playSeg(startSec, duration);
    },
    async onSubmit() {
      const resp = await fetch(
        `/api/getposition?q=${encodeURIComponent(this.zh)}`
      );
      this.positions = await resp.json();
      await this.say();
    },
    async playSeg(start, duration) {
      player.pauseVideo();
      player.seekTo(start, true);
      player.playVideo();
      await sleep(duration * 1000);
      player.pauseVideo();
    },
    async say() {
      for (let i = 0; i < this.positions.length; i++) {
        const word = this.positions[i];
        await this.playSeg(word.startSec, word.duration);
      }
    }
  }
};
</script>

<style>
body {
  background-color: rgba(0, 0, 0, 0.05);
  font-size: 1.1rem;
  font-family: Microsoft JhengHei, Helvetica Neue, Helvetica, Arial, sans-serif;
  font-weight: 400;
  letter-spacing: 1px;
  -webkit-font-smoothing: antialiased;
  overflow-wrap: break-word;
  word-wrap: break-word;
}
.howger {
  background: #fff;
  padding: 30px;
  border-radius: 4px;
  margin-top: 2.5rem;
}
</style>
