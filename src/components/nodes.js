export default {
    name: 'Nodes',
    data () {
        return {
            tree: {}
        };
    },
    created () {
        let self = this;
        this.axios.get('/api/node/tree')
            .then(function (res) {
                console.log(res);
                self.tree = res.data;
            });
    },
    methods: {
        createNode () {
            console.log('createNode');
            let params = {
                description: '新节点'
            };
            this.axios.post('/api/node/add', params)
                .then(function (res) {
                    console.log(res);
                });
        }
    }
};
