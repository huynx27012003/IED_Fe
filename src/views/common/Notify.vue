<template>
    <div>
        <table>
            <tr v-for="(item, index) in notifyList" :key="index">
                <td>
                    
                </td>
            </tr>
            
        </table>
    </div>
  
</template>

<script>
/* eslint-disable */
export default {
    name : 'NotifyList',
    data() {
        return {
            notifyList : []
        }
    },
    methods: {
        loadData() {
            
        }
    }
}
</script>

<style>

</style>