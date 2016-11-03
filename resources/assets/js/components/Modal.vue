<template>
    <transition name="modal">
        <div class="modal media-modal modal-mask" @click="$emit('close')">
            <div class="modal-dialog" :class="[size]" @click.stop>
                <div class="modal-content">
                    <slot></slot>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
    export default {

        props: {
            'size' :{
                default : 'modal-lg'
            }
        },

        mounted: function () {
            document.addEventListener("keydown", (e) => {
                if (this.show && e.keyCode == 27) {
                    this.close();
                }
            });
        }
    }
</script>
