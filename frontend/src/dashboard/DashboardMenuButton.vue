<script setup>
import { inject, ref } from 'vue'
import { useRouter } from 'vue-router'

const dashboard = inject('dashboard')
const showDeleteDialog = ref(false)
const router = useRouter()
async function handleDelete() {
	await dashboard.deleteDashboard()
	showDeleteDialog.value = false
	router.push({ name: 'Dashboards' })
}
</script>

<template>
	<Dropdown
		v-if="dashboard.doc"
		placement="left"
		:button="{ icon: 'more-vertical', variant: 'outline' }"
		:options="[
			{
				label: 'Delete',
				variant: 'outline',
				theme: 'red',
				icon: 'trash-2',
				onClick: () => (showDeleteDialog = true),
			},
		]"
	/>

	<Dialog
		v-model="showDeleteDialog"
		:dismissable="true"
		:options="{
			title: 'Delete Dashboard',
			message: 'Are you sure you want to delete this dashboard?',
			icon: { name: 'trash', variant: 'solid', theme: 'red' },
			actions: [
				{ label: 'Cancel', variant: 'outline', onClick: () => (showDeleteDialog = false) },
				{ label: 'Yes', variant: 'solid', theme: 'red', onClick: handleDelete },
			],
		}"
	>
	</Dialog>
</template>
