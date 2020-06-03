<template>
  <section class="howger">
    <no-ssr>
      <div class="container">
        <div class="row">
          <div class="col text-center p-3">
            <h2>HowfunSong - 昊哥幫你念</h2>
            <h6 class="text-secondary">好放送，放送昊哥好祝福</h6>
            <h6 class="text-secondary">手機上可能會怪怪的</h6>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="container">
          <div class="d-flex justify-content-between text-center">
            <div style="margin: 0 auto;" :style="{opacity: buffering? '0.1':'1'}">
              <div id="ytplayer"></div>
            </div>
          </div>
          <div class="col text-center">
            <div class="progress" v-if="buffering">
              <div
                class="progress-bar"
                role="progressbar"
                :style="`width: ${bufferedPercent}%;`"
                :aria-valuenow="bufferedPercent"
                aria-valuemin="0"
                aria-valuemax="100"
              >昊哥練習中</div>
            </div>
            <form @submit.prevent="onSubmit">
              <div class="form-group">
                <label for="zh">在下方文字框中輸入中文，讓昊哥幫你念</label>
                <textarea class="form-control" id="zh" rows="3" v-model="zh"></textarea>
              </div>
              <button type="submit" class="btn btn-primary btn-block mb-2" :disabled="saying">請朗讀</button>
            </form>
            <button @click.prevent="shareOnFb" class="btn btn-info">分享到臉書</button>
          </div>
        </div>
      </div>
      <div v-if="positions.length > 0 && showEditArea" class="row mt-4">
        <div class="alert alert-secondary alert-dismissible alert-tips fade show" role="alert">
          <div class="container">
            <div class="col text-center p-3">
              <h6 class="mb-3">聽起來怪怪的？輸入更精確的時間就可以修正囉（秒可以有小數點呦！）</h6>
              <span v-for="(p, i) in positions" :key="i">
                <WordPositionInput
                  :pinyin="p.pinyin"
                  :start-sec="p.startSec"
                  :duration="p.duration"
                  :saying="saying"
                  @submit="onSoftUpdate"
                />
              </span>
              <button
                type="button"
                class="close"
                data-dismiss="alert"
                aria-label="Close"
                @click.prevent="showEditArea = false"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="row mt-4" v-if="audit">
        <div class="alert alert-secondary alert-dismissible alert-tips fade show" role="alert">
          <div class="container">
            <div class="col text-center p-3">
              <h6 class="mb-3">聽起來怪怪的？請幫我們輸入更精確的時間（秒可以有小數點呦！）</h6>
              <span v-for="(p, i) in all_positions" :key="i">
                <WordPositionInput
                  :pinyin="p.pinyin"
                  :start-sec="p.startSec"
                  :duration="p.duration"
                  :saying="saying"
                  @submit="onUpdate"
                />
              </span>
              <button
                type="button"
                class="close"
                data-dismiss="alert"
                aria-label="Close"
                @click.prevent="showEditArea = false"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <hr />
      <div class="text-center text-secondary">
        <small>假日不想寫作業一時興起的產物，博君一笑便民服務，影片屬How哥所有。</small>
        <small>
          <a href="https://github.com/aotter/howgersay" target="_blank">GitHub</a>
        </small>
      </div>
    </no-ssr>
  </section>
</template>

<script>
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default {
  asyncData({ req }) {
    const { zh, audit } = req.query;
    return { zh, audit };
  },
  head() {
    return {
      title: this.zh ? `昊哥說：${this.zh}` : "HowfunSong - 昊哥幫你念",
      meta: [
        { property: "og:title", content: `昊哥說：${this.zh}` },
        {
          property: "og:image",
          content: "https://i.ytimg.com/vi/sNcvgpUqrwE/maxresdefault.jpg"
        }
      ]
    };
  },
  components: {
    WordPositionInput: () => import("~/components/WordPositionInput")
  },
  data() {
    return {
      buffering: false,
      buffered: 0,
      player: null,
      audit: false,
      saying: false,
      showEditArea: false,
      zh: "",
      positions: [],
      all_positions: []
    };
  },
  computed: {
    bufferedPercent() {
      return (this.buffered / (this.positions.length * 2)) * 100;
    }
  },
  methods: {
    shareOnFb() {
      const share = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        "https://lab.howgersay.aotter.net" + this.$route.fullPath
      )}`;
      window.open(share);
    },
    formatMinSec(input) {
      return `${Math.floor(input / 60)}:${Math.round((input % 60) * 10) / 10}`;
    },
    appendToQuery() {
      const qp = this.positions.map(p => {
        return { p: p.pinyin, s: p.startSec };
      });
      const q = JSON.stringify({ p: qp });
      this.$router.push({ query: { q, zh: this.zh } });
    },
    async onSoftUpdate({ pinyin, startSec, duration }) {
      this.positions = this.positions.map(p => {
        if (p.pinyin === pinyin) {
          p.startSec = startSec;
          p.duration = duration;
        }
        return p;
      });
      this.appendToQuery();
      await this.playSeg(startSec, duration);
      this.player.pauseVideo();
    },
    // audit mode only
    async onUpdate({ pinyin, startSec, duration }) {
      await fetch("/api/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=utf-8"
        },
        body: JSON.stringify({ pinyin, startSec, duration })
      });
      await this.playSeg(startSec, duration);
      this.player.pauseVideo();
    },
    async onSubmit() {
      this.positions = [];
      const jsonStr = this.$route.query.q;
      let queryPositionsDict = {};
      if (jsonStr) {
        try {
          JSON.parse(jsonStr).p.forEach(po => {
            queryPositionsDict[po.p] = po.s;
          });
        } catch (e) {
          // ignore
        }
      }
      const resp = await fetch(
        `/api/getposition?q=${encodeURIComponent(this.zh)}`
      );
      const serverPositions = await resp.json();
      this.positions = serverPositions.map(p => {
        const queryPosStartSec = queryPositionsDict[p.pinyin];
        if (queryPosStartSec) {
          p.startSec = queryPosStartSec;
        }
        return p;
      });

      this.appendToQuery();

      this.showEditArea = true;
      this.saying = true;
      await this.say();
      this.saying = false;
    },
    async playSeg(start, duration) {
      if (start) {
        this.player.seekTo(start, true);
        this.player.playVideo();
      } else {
        this.player.pauseVideo();
      }
      await sleep(duration * 1000);
    },
    async say() {
      this.buffering = true;
      this.buffered = 0;
      this.player.mute();
      for (let i = 0; i < this.positions.length; i++) {
        const word = this.positions[i];
        await this.playSeg(word.startSec, word.duration);
        this.buffered++;
      }
      for (let i = 0; i < this.positions.length; i++) {
        const word = this.positions[i];
        await this.playSeg(word.startSec, word.duration);
        this.buffered++;
      }
      this.buffering = false;
      this.player.unMute();
      for (let i = 0; i < this.positions.length; i++) {
        const word = this.positions[i];
        await this.playSeg(word.startSec, word.duration);
      }
      this.player.pauseVideo();
    }
  },
  async mounted() {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/player_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    const VIDEO_ID = "sNcvgpUqrwE";

    window.onYouTubePlayerAPIReady = () => {
      this.player = new YT.Player("ytplayer", {
        width: 360,
        height: 240,
        videoId: VIDEO_ID
      });
    };

    // remove after audit over
    if (this.audit) {
      const resp = await fetch(`/api/getcurrdata`);
      const { wordData } = await resp.json();
      this.all_positions = Object.keys(wordData)
        .map(k => {
          return { pinyin: k, startSec: wordData[k], duration: 0.7 };
        })
        .sort((a, b) => a.startSec - b.startSec);
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
.alert-tips {
  width: 90%;
  padding: 0px;
  margin: 10px auto;
}
</style>
