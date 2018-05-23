<template lang="pug">
    #main
        #node-tree
            | 根节点
        button(@click="createNode")
            | 添加节点
</template>

<script type="text/ecmascript-6">
    import nodes from './nodes';
    export default {
        ...nodes
    };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="stylus">
    @import "nodes.styl"
</style>
