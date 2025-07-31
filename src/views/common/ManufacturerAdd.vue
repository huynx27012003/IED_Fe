<template>
    
    <div>
        <el-dialog
            :visible.sync="sign"
            title="Add Manufacturer"
            width="35%"
            align-center
            :before-close="handleClose"
            draggable
            :modal="false"
            custom-class="custom-dialog-border"
        >
            <el-form label-width="100px" label-position="left" size="small">
                <el-form-item label="NAME">
                    <el-input v-model="name"></el-input>
                </el-form-item>
            </el-form>

            <span slot="footer" class="dialog-footer">
                <el-button type="danger" @click="handleClose()" size="small">Cancel</el-button>
                <el-button type="primary" @click="handleConfirm()" size="small">Confirm</el-button>
            </span>

        </el-dialog>
    </div>
</template>

<script>
/* eslint-disable */
import * as manuAPI from '@/api/manuAPI/manuAPI.js'
export default {
    name : "manufacturerAdd",
    props: {
        showAdd: {
            type : Boolean,
        },
        title: {
            type : String,
            require : true
        },
        modeManu : {
            require : true 
        },
        dataProperties: {
            require : true
        }
    },
    data() {
        return {
            sign : false,
            name : ''
        }
    },
    watch: {
        showAdd(newVal) {
            if(newVal == true) {
                this.sign = true
            }
        },
        modeManu(newVal) {
            if(newVal == 'edit') {
                this.name = JSON.parse(JSON.stringify(this.dataProperties.name))
            }
        }
    },
    
    methods:{
        handleClose() {
            this.sign = false
            this.$emit('backSign', false)
        },
        async handleConfirm() {
            if(this.modeManu == 'insert') {
                if(this.name == '') {
                    this.$message.error("Name can not be empty")
                } else {
                    try {
                        const rs = await manuAPI.getManuByName(this.name)
                        if(rs.length !=0) {
                            var data = rs[0]
                            if(data.type == undefined || data.type == '' || data.type == null || data.type == 'null') {
                                data.type = this.title
                            } else {
                                if(!data.type.includes(this.title)) {
                                    data.type = data.type + ',' + this.title
                                }
                            }
                            data.name = this.name
                            try {
                                const rt = await manuAPI.updateManuById(data.id, data)
                                if(rt.success) {
                                    this.$message.success("Update success")
                                } else {
                                    this.$message.error("Update error")
                                }
                            }catch(e) {
                                this.$message.error("Cannot update data")
                            }
                        } else {
                            let data = {
                                id : '',
                                name : this.name,
                                type : this.title
                            }
                            try {
                                const rt = await manuAPI.createManu(data)
                                this.$message.success("Insert success")
                            } catch(e) {
                                console.log(e)
                                this.$message.error("Insert error")
                            }
                            
                        }
                        this.sign = false
                        this.$emit('backSign', false)
                    } catch(e) {
                        this.$message.error("Cannot insert manufacturer")
                    }
                }
            } else if(this.modeManu == 'edit') {
                var data = {
                    id : this.dataProperties.id,
                    name : this.name,
                    type : this.dataProperties.type
                }
                if(data.name == '') {
                    this.$message.error("Name cannot be null")
                } else {
                    try {
                        var rs = await manuAPI.updateManuById(data.id, data)
                        this.$message.success("Success")
                    } catch(e) {
                        console.log(e)
                        this.$message.error("Error")
                    }   
                }
                this.sign = false
                this.$emit('backSignUpdate', this.name)
            }
        },
    }
}
</script>

<style lang="scss" scoped>
.custom-dialog-border{
    border: 1px solid #000; /* Đặt viền 1px màu đen */
    margin-top: 20px !important;
}
</style>
