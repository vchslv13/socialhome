import Vue from "vue"
import BootstrapVue from "bootstrap-vue"
import VueInfiniteScroll from "vue-infinite-scroll"
import VueMasonryPlugin from "vue-masonry"
import VueRouter from "vue-router"
import VueSnotify from "vue-snotify"

import Axios from "axios"
import ReconnectingWebSocket from "ReconnectingWebSocket/reconnecting-websocket.min"

import router from "frontend/routes"

import {newStreamStore, streamStoreOperations} from "frontend/stores/streamStore"
import applicationStore from "frontend/stores/applicationStore"

import "frontend/components/streams/Stream.vue"

// CSS
import "frontend/main.stylesheet"


Vue.use(BootstrapVue)
Vue.use(VueInfiniteScroll)
Vue.use(VueMasonryPlugin)
Vue.use(VueRouter)
Vue.use(VueSnotify)

Vue.prototype.$http = Axios.create({
    xsrfCookieName: "csrftoken",
    xsrfHeaderName: "X-CSRFToken",
})

const store = newStreamStore({
    modules: {applicationStore},
    baseURL: "",
    axios: Vue.prototype.$http,
})

const main = new Vue({
    el: "#app",
    store,
    router,
    methods: {
        onWebsocketMessage(message) {
            const data = JSON.parse(message.data)

            if (data.event === "new") {
                this.$store.dispatch(streamStoreOperations.receivedNewContent, data.id)
            }
        },
        websocketPath() {
            const websocketProtocol = window.location.protocol === "https:" ? "wss" : "ws"
            return `${websocketProtocol}://${window.location.host}/ch/streams/${this.$store.state.streamName}/`
        },
    },
    created() {
        this.$websocket = new ReconnectingWebSocket(this.websocketPath())
        this.$websocket.onmessage = message => this.onWebsocketMessage(message)
        Vue.snotify = this.$snotify
    },
    beforeDestroy() {
        this.$websocket.close()
    },
})

export default main
