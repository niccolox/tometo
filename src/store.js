import Vue from 'vue'
import Vuex from 'vuex'
import { register, login, logout, poll } from './service/auth'
import { postStatus } from './service/status'
import { createAvatar } from './service/avatar'
import router from './router'

Vue.use(Vuex)

export default new Vuex.Store({
	state: {
		username: localStorage.getItem('username') || null,
		cookiesAcknowledged: localStorage.getItem('cookiesAcknowledged') || false,
		hasAvatar: false,
		loading: false,
		flash: {
			error: null,
			info: null
		}
	},
	mutations: {
		setUsername (state, username) {
			localStorage.setItem('username', username)
			state.username = username
		},
		clearUsername (state) {
			state.username = null
		},
		toggleLoading (state) {
			state.loading = !state.loading
		},
		setInfoFlash (state, msg) {
			state.flash.info = msg
			setTimeout(() => {
				state.flash.info = null
			}, 3000)
		},
		setErrorFlash (state, msg) {
			state.flash.error = msg
			setTimeout(() => {
				state.flash.error = null
			}, 5000)
		},
		clearFlash (state) {
			state.flash = {
				info: null,
				error: null
			}
		},
		acknowledgeCookies (state) {
			localStorage.setItem('cookiesAcknowledged', true)
			state.cookiesAcknowledged = true
		},
		setHasAvatar (state) {
			state.hasAvatar = true
		}
	},
	actions: {
		register ({ commit }, { username, password, confirmPassword, email }) {
			commit('toggleLoading')

			register(username, password, confirmPassword, email).then(data => {
				commit('toggleLoading')
				router.push('/')
				commit('setInfoFlash', data.message)
			}, error => {
				commit('toggleLoading')
				commit('setErrorFlash', error)
			})
		},
		login ({ commit }, { username, password }) {
			commit('toggleLoading')

			login(username, password).then(user => {
				commit('toggleLoading')
				commit('setUsername', user.username)
				router.push('/')
				commit('setInfoFlash', 'Signed in successfully.')
			}, error => {
				commit('toggleLoading')
				commit('setErrorFlash', error)
			})
		},
		logout ({ commit }) {
			logout().then(data => {
				commit('clearUsername')
				localStorage.removeItem('username')
			})
		},
		newStatus ({ commit }, { content, pitch }) {
			commit('toggleLoading')

			postStatus(content, pitch).then(data => {
				commit('toggleLoading')
				router.push(`/status/${data}`)
			}, error => {
				commit('toggleLoading')
				commit('setErrorFlash', error)
			})
		},
		createAvatar ({ commit }, { name, pitch, speed, language, gender, pic1, pic2 }) {
			commit('toggleLoading')

			createAvatar(name, pitch, speed, language, gender, pic1, pic2).then(data => {
				commit('toggleLoading')
				commit('setHasAvatar')
				commit('setInfoFlash', data.message)
				router.push('/')
			}, error => {
				commit('toggleLoading')
				commit('setErrorFlash', error)
			})
		},
		poll ({ commit }) {
			poll().then(data => {
				if (!data) {
					commit('clearUsername')
				}

				if (data.has_avatar) {
					commit('setHasAvatar')
				}
			})
		}
	}
})
