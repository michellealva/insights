import { getTrialStatus } from '@/subscription'
import auth from '@/utils/auth'
import { getOnboardingStatus } from '@/utils/onboarding'
import settings from '@/utils/settings'
import { createRouter, createWebHistory } from 'vue-router'
import { isSetupComplete } from '@/setup'

const routes = [
	{
		path: '/setup',
		name: 'Setup',
		component: () => import('@/setup/Setup.vue'),
		meta: {
			hideSidebar: true,
		},
	},
	{
		path: '/login',
		name: 'Login',
		component: () => import('@/pages/Login.vue'),
		meta: {
			hideSidebar: true,
			allowGuest: true,
		},
	},
	{
		path: '/',
		redirect: '/get-started',
	},
	{
		path: '/get-started',
		name: 'Get Started',
		component: () => import('@/pages/GetStarted.vue'),
	},
	{
		path: '/dashboard',
		name: 'Dashboards',
		component: () => import('@/dashboard/DashboardList.vue'),
	},
	{
		props: true,
		name: 'Dashboard',
		path: '/dashboard/:name',
		component: () => import('@/dashboard/Dashboard.vue'),
	},
	{
		props: true,
		name: 'PublicDashboard',
		path: '/public/dashboard/:public_key',
		component: () => import('@/dashboard/PublicDashboard.vue'),
		meta: {
			hideSidebar: true,
			allowGuest: true,
		},
	},
	{
		props: true,
		name: 'PublicChart',
		path: '/public/chart/:public_key',
		component: () => import('@/query/PublicChart.vue'),
		meta: {
			hideSidebar: true,
			allowGuest: true,
		},
	},
	{
		path: '/data-source',
		name: 'DataSourceList',
		component: () => import('@/datasource/DataSourceList.vue'),
	},
	{
		props: true,
		name: 'DataSource',
		path: '/data-source/:name',
		component: () => import('@/datasource/DataSource.vue'),
	},
	{
		props: true,
		name: 'DataSourceTable',
		path: '/data-source/:name/:table',
		component: () => import('@/datasource/DataSourceTable.vue'),
	},
	{
		path: '/query',
		name: 'QueryList',
		component: () => import('@/query/QueryList.vue'),
	},
	{
		props: true,
		name: 'QueryBuilder',
		path: '/query/build/:name',
		component: () => import('@/query/QueryBuilder.vue'),
	},
	{
		path: '/users',
		name: 'Users',
		component: () => import('@/pages/Users.vue'),
		meta: {
			isAllowed: () => auth.user.is_admin && settings.doc.enable_permissions,
		},
	},
	{
		path: '/teams',
		name: 'Teams',
		component: () => import('@/pages/Teams.vue'),
		meta: {
			isAllowed: () => auth.user.is_admin && settings.doc.enable_permissions,
		},
	},
	{
		path: '/notebook',
		name: 'NotebookList',
		component: () => import('@/notebook/NotebookList.vue'),
	},
	{
		props: true,
		path: '/notebook/:notebook',
		name: 'Notebook',
		component: () => import('@/notebook/Notebook.vue'),
	},
	{
		props: true,
		path: '/notebook/:notebook/:page',
		name: 'NotebookPage',
		component: () => import('@/notebook/NotebookPage.vue'),
	},
	{
		path: '/settings',
		name: 'Settings',
		component: () => import('@/pages/Settings.vue'),
	},
	{
		path: '/no-permission',
		name: 'No Permission',
		component: () => import('@/pages/NoPermission.vue'),
		meta: {
			hideSidebar: true,
		},
	},
	{
		path: '/not-found',
		name: 'Not Found',
		component: () => import('@/pages/NotFound.vue'),
		meta: {
			hideSidebar: true,
		},
	},
	{
		path: '/trial-expired',
		name: 'Trial Expired',
		component: () => import('@/pages/TrialExpired.vue'),
		meta: {
			hideSidebar: true,
		},
	},
]

let router = createRouter({
	history: createWebHistory('/insights'),
	routes,
})

router.beforeEach(async (to, from, next) => {
	if (to.meta.allowGuest && !auth.isLoggedIn && to.name !== 'Login') {
		// if page is allowed for guest, and is not login page, allow
		return next()
	}

	// route to login page if not logged in
	if (!auth.isLoggedIn) {
		// if in dev mode, open login page
		if (import.meta.env.DEV) {
			return to.fullPath === '/login' ? next() : next('/login')
		}
		// redirect to frappe login page, for oauth and signup
		window.location.href = '/login'
		return next(false)
	}

	const isAuthorized = await auth.isAuthorized()
	const trialExpired = await getTrialStatus()
	if (trialExpired && to.name !== 'Trial Expired') {
		return next('/trial-expired')
	}
	if (!isAuthorized && to.name !== 'No Permission') {
		return next('/no-permission')
	}
	if (isAuthorized && to.name === 'No Permission') {
		return next()
	}
	if (to.meta.isAllowed && !to.meta.isAllowed()) {
		return next('/no-permission')
	}

	// redirect to /setup if setup is not complete
	const setupComplete = await isSetupComplete()
	if (!setupComplete && to.name !== 'Setup') {
		return next('/setup')
	}
	// redirect to / if setup is complete and user is on /setup
	if (setupComplete && to.name === 'Setup') {
		return next('/')
	}

	// redirect to /dashboard if onboarding is complete
	const onboardingComplete = await getOnboardingStatus()
	if (onboardingComplete && to.name == 'Get Started') {
		return next('/dashboard')
	}

	to.path === '/login' ? next('/') : next()
})

const _fetch = window.fetch
window.fetch = async function () {
	const res = await _fetch(...arguments)
	if (res.status === 403 && (!document.cookie || document.cookie.includes('user_id=Guest'))) {
		auth.reset()
		router.push('/login')
	}
	return res
}

export default router
