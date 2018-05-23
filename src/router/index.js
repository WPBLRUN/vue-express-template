import Vue from 'vue';
import Router from 'vue-router';
import Nodes from '../components/nodes.vue';

Vue.use(Router);

export default new Router({
    routes: [
        {
            path: '/',
            name: 'Nodes',
            component: Nodes
        }
    ]
});
