<template>
  <section>
    <div class="row">
      <div class="col">
        <div id="ytplayer"></div>
      </div>
    </div>
    <div class="row">
      <div class="col">
        <form @submit.prevent="onSubmit">
          <div class="form-group">
            <label for="zh">輸入中文昊哥幫你念</label>
            <textarea class="form-control" id="zh" rows="3" v-model="zh"></textarea>
          </div>
          <button type="submit" class="btn btn-primary mb-2">請朗讀</button>
        </form>
      </div>
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
</style>
