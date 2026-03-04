<script lang="ts">
	import ValuationMultiStepForm from '$lib/components/valuation/ValuationMultiStepForm.svelte';

	let { data, form } = $props();
</script>

<ValuationMultiStepForm phoneModels={data.phoneModels} helpTips={data.helpTips} {form} />
