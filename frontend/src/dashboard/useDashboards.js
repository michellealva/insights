import dayjs from '@/utils/dayjs'
import { call, createResource } from 'frappe-ui'
import { defineStore } from 'pinia'

export default defineStore('dashboards', {
	state: () => ({
		list: [],
		loading: false,
		creating: false,
		deleting: false,
		currentDashboard: undefined,
	}),
	actions: {
		async reload() {
			this.loading = true
			this.list = await dashboards.fetch()
			this.loading = false
			return this
		},
		async create(title) {
			if (!title) return
			this.creating = true
			const { name } = await createDashboard.submit({ title })
			this.creating = false
			this.reload()
			return name
		},
		async toggleLike(dashboard) {
			await toggleLike.submit({
				doctype: 'Insights Dashboard',
				name: dashboard.name,
				add: !dashboard.is_favourite ? 'Yes' : 'No',
			})
			this.reload()
		},
		async delete(dashboard) {
			this.deleting = true
			await deleteDoc.submit({
				doctype: 'Insights Dashboard',
				name: dashboard.name,
			})
			this.deleting = false
			this.reload()
		},
		setCurrentDashboard(dashboard) {
			this.currentDashboard = dashboard
		},
		resetCurrentDashboard() {
			this.currentDashboard = undefined
		},
	},
})

const dashboards = createResource({
	url: 'insights.api.get_dashboard_list',
	initialData: [],
	cache: 'dashboardsList',
	transform(data) {
		return data.map((dashboard) => {
			dashboard.modified_from_now = dayjs(dashboard.modified).fromNow()
			return dashboard
		})
	},
})
const createDashboard = createResource({
	url: 'insights.api.create_dashboard',
})
const toggleLike = createResource({
	url: 'frappe.desk.like.toggle_like',
})
const deleteDoc = createResource({
	url: 'frappe.client.delete',
})

export function getQueriesColumn(query_names) {
	return call(
		'insights.insights.doctype.insights_dashboard.insights_dashboard.get_queries_column',
		{
			query_names,
		}
	)
}
export function getQueryColumns(query) {
	return call(
		'insights.insights.doctype.insights_dashboard.insights_dashboard.get_query_columns',
		{
			query,
		}
	)
}
