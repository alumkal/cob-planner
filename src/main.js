import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import Layout from './components/Layout.vue';
import FieldPage from './components/FieldPage.vue';
import ReusePage from './components/ReusePage.vue';
import store from './store/index.js';

// Create router
const routes = [
  { 
    path: '/', 
    component: Layout,
    children: [
      { path: '', redirect: '/field' },
      { path: 'field', component: FieldPage },
      { path: 'reuse', component: ReusePage }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Create and mount the app
const app = createApp(App);
app.use(store);
app.use(router);
app.mount('#app');