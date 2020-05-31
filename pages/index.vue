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
              <label for="zh">在下方文字框中輸入中文，讓昊哥幫你念(第一個字容易漏唸，可以重複打一次）</label>
              <textarea class="form-control" id="zh" rows="3" v-model="zh"></textarea>
            </div>
            <button type="submit" class="btn btn-primary btn-block mb-2">請朗讀</button>
          </form>
        </div>
      </div>
    </div>
    <div class="text-center text-secondary">
      <small>假日不想寫作業一時興起的產物</small>
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
  data() {
    return {
      zh: ""
    };
  },
  methods: {
    async onSubmit() {
      const positions = await this.toPinyin(this.zh);
      await this.say(positions);
      player.stopVideo();
    },
    async toPinyin(zh) {
      const resp = await fetch(`/api/getposition?q=${encodeURIComponent(zh)}`);
      const j = await resp.json();
      return j;
    },
    async playSeg(start, duration) {
      player.seekTo(start, true);
      await sleep(duration * 1000);
    },
    async say(positions) {
      for (let i = 0; i < positions.length; i++) {
        const element = positions[i];
        await this.playSeg(element, 0.9);
      }
    }
  },
  mounted() {}
};
</script>

<style>
body {
  background-color: rgba(0,0,0,.05);
  font-size: 1.1rem;
  font-family: Microsoft JhengHei,Helvetica Neue,Helvetica,Arial,sans-serif;
  font-weight: 400;
  letter-spacing: 1px;
  -webkit-font-smoothing: antialiased;
  overflow-wrap: break-word;
  word-wrap: break-word;
}
.howger {
  background: #FFF;
  padding: 30px;
  border-radius: 4px;
  margin-top: 2.5rem;
}
</style>
