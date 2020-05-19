import apiClient from '~/services/apiClient'

const serialize = (obj) => {
  return '?' + Object.keys(obj).reduce(function (a, k) { a.push(k + '=' + encodeURIComponent(obj[k])); return a }, []).join('&')
}


export default {
  auth: {
    getUser: (userId, filter) =>
      apiClient.get(`/api/users/${userId}?filter=${JSON.stringify(filter)}`),
    checkRole: userId => apiClient.get(`/api/users/checkRole?id=${userId}`),
    login: data => apiClient.post("/api/users/login", data),
    logout: () => apiClient.post("/api/users/logout"),
    reset_link: data => apiClient.post("/api/users/reset", data),
    reset_pass: data => apiClient.post("/api/users/reset-password", data)
  },
  users: {
    list: filter =>
      apiClient.get(`/api/Users?filter=${JSON.stringify(filter)}`),
    findRole: id => apiClient.get(`/api/Users/${id}/Roles`),
    insert: data => apiClient.post("/api/Users", data),
    update: data => apiClient.put("/api/Users", data),
    upsert: (id, data) => apiClient.patch(`/api/Users/${id}`, data),
    delete: id => apiClient.delete(`/api/Users/${id}`),
    check: data => apiClient.post("/api/users/check", data)
  },
  settings: {
    list: filter =>
      apiClient.get(`/api/settings?filter=${JSON.stringify(filter)}`),
    insert: data => apiClient.post("/api/settings", data),
    update: data => apiClient.put("/api/settings", data),
    upsert: (id, data) => apiClient.patch(`/api/settings/${id}`, data),
    delete: id => apiClient.delete(`/api/settings/${id}`)
  },
  roles: {
    list: filter =>
      apiClient.get(
        `/api/Roles${filter ? "?filter=" + JSON.stringify(filter) : ""}`
      ),
    findOne: id => apiClient.get(`/api/Roles/${id}`),
    findByName: filter =>
      apiClient.get(`/api/Roles/findOne?filter=${JSON.stringify(filter)}`),
    update: data =>
      apiClient.put(`/api/users/${data.id}/roles/rel/${data.roleId}`),
    deleteAll: id => apiClient.delete(`/api/users/${id}/roles`),
    delete: data =>
      apiClient.delete(`/api/users/${data.id}/roles/rel/${data.roleId}`)
  },
  products: {
    list: filter =>
      apiClient.get(
        `/api/Products${filter ? "?filter=" + JSON.stringify(filter) : ""}`
      ),
    getOne: id => apiClient.get(`api/Products/${id}`),
    insert: data => apiClient.post("/api/Products", data),
    update: data => apiClient.patch("/api/Products", data),
    delete: id => apiClient.delete(`/api/Products/${id}`)
  },
  files: {
    delete: ({ container, file }) =>
      apiClient.delete(`/api/containers/${container}/files/${file}`),
    deleteUserFiles: data =>
      apiClient.post(`/api/containers/deleteUserUploads`, data),
    deleteContainer: container =>
      apiClient.delete(`/api/containers/${container}`),
    checkContainer: container => apiClient.get(`api/containers/${container}`),
    createContainer: container =>
      apiClient.post(`api/containers`, { name: container }),
    list: container => apiClient.get(`api/containers/${container}/files`),
    getFile: ({ container, file }) =>
      apiClient.get(`api/containers/${container}/files/${file}`),
    downloadFile: ({ container, file }) =>
      apiClient.get(`api/containers/${container}/download/${file}`),
    copyFiles: data => apiClient.post(`api/containers/copyFiles`, data)
  },
  productSells: {
    list: filter =>
      apiClient.get(
        `/api/productSells${filter ? "?filter=" + JSON.stringify(filter) : ""}`
      ),
    getSellInterests: filter =>
      apiClient.get(
        `/api/productSells/sellInterests${filter ? serialize(filter) : ""}`
      ),
    getExpiringProducts: filter =>
      apiClient.get(
        `/api/productSells/getExpiringProducts${
        filter ? serialize(filter) : ""
        }`
      ),
    getOne: (id, filter) =>
      apiClient.get(
        `api/productSells/${id}${
        filter ? "?filter=" + JSON.stringify(filter) : ""
        }`
      ),
    insert: data => apiClient.post("/api/productSells", data),
    update: data => apiClient.patch("/api/productSells", data),
    delete: id => apiClient.delete(`/api/productSells/${id}`),
    getPendingAdmin: filter =>
      apiClient.get(
        `api/productSells/getInterestsAdmin${
        filter ? "?filter=" + JSON.stringify(filter) : ""
        }`
      )
  },
  productSellsTransactions: {
    list: filter =>
      apiClient.get(
        `/api/productSellsTransactions${
        filter ? "?filter=" + JSON.stringify(filter) : ""
        }`
      ),
    getOne: (id, filter) =>
      apiClient.get(
        `api/productSellsTransactions/${id}${
        filter ? "?filter=" + JSON.stringify(filter) : ""
        }`
      ),
    sellOrders: () => apiClient.get("/api/productSellsTransactions/sellOrders"),
    negotiations: () =>
      apiClient.get("/api/productSellsTransactions/negotiations"),
    buyOrders: () => apiClient.get("/api/productSellsTransactions/buyOrders"),
    sampleOrders: () =>
      apiClient.get("/api/productSellsTransactions/sampleOrders"),
    insert: data => apiClient.post("/api/productSellsTransactions", data),
    acceptNegotiation: (id, data) =>
      apiClient.post(
        `/api/productSellsTransactions/acceptNegotiation/${id}`,
        data
      ),
    rejectNegotiation: (id, data) =>
      apiClient.post(
        `/api/productSellsTransactions/rejectNegotiation/${id}`,
        data
      ),
    counterOffer: (id, data) =>
      apiClient.post(`/api/productSellsTransactions/counterOffer/${id}`, data),
    getTransactions: filter =>
      apiClient.get(
        `api/productSellsTransactions/getTransactions${
        filter ? serialize(filter) : ""
        }`
      )
  },
  messages: {
    list: filter =>
      apiClient.get(
        `/api/messages${filter ? "?filter=" + JSON.stringify(filter) : ""}`
      ),
    findOne: (id, filter) =>
      apiClient.get(
        `/api/messages/${id}${
        filter ? "?filter=" + JSON.stringify(filter) : ""
        }`
      ),
    count: filter =>
      apiClient.get(
        `/api/messages/count${filter ? "?where=" + JSON.stringify(filter) : ""}`
      ),
    markRead: () => apiClient.get(`/api/messages/markRead`),
    update: data => apiClient.patch("/api/messages", data)
  },
  productSellsOffers: {
    list: filter =>
      apiClient.get(
        `/api/productSellsOffers${
        filter ? "?filter=" + JSON.stringify(filter) : ""
        }`
      ),
    getOne: (id, filter) =>
      apiClient.get(
        `api/productSellsOffers/${id}${
        filter ? "?filter=" + JSON.stringify(filter) : ""
        }`
      ),
    insert: data => apiClient.post("/api/productSellsOffers", data),
    update: data => apiClient.patch("/api/productSellsOffers", data),
    makeOffer: data =>
      apiClient.patch("api/productSellsOffers/makeOffer", data),
    delete: id => apiClient.delete(`/api/productSellsOffers/softDelete/${id}`),
    approve: id =>
      apiClient.post("/api/productSellsOffers/adminApprove", { id }),
    reject: (id, reasson) =>
      apiClient.post("/api/productSellsOffers/adminReject", { id, reasson })
  },
  productSellsOffersTransactions: {
    list: filter =>
      apiClient.get(
        `/api/productSellsOffersTransactions${
        filter ? "?filter=" + JSON.stringify(filter) : ""
        }`
      ),
    getOne: (id, filter) =>
      apiClient.get(
        `api/productSellsOffersTransactions/${id}${
        filter ? "?filter=" + JSON.stringify(filter) : ""
        }`
      ),
    insert: data => apiClient.post("/api/productSellsOffersTransactions", data),
    acceptNegotiation: (id, data) =>
      apiClient.post(
        `/api/productSellsOffersTransactions/acceptNegotiation/${id}`,
        data
      ),
    rejectNegotiation: (id, data) =>
      apiClient.post(
        `/api/productSellsOffersTransactions/rejectNegotiation/${id}`,
        data
      ),
    counterOffer: (id, data) =>
      apiClient.post(
        `/api/productSellsOffersTransactions/counterOffer/${id}`,
        data
      )
  },
  productSellsCounterOffers: {
    list: filter =>
      apiClient.get(
        `/api/productSellsCounterOffers${
        filter ? "?filter=" + JSON.stringify(filter) : ""
        }`
      ),
    getOne: (id, filter) =>
      apiClient.get(
        `api/productSellsCounterOffers/${id}${
        filter ? "?filter=" + JSON.stringify(filter) : ""
        }`
      )
  },
  news: {
    list: () =>
      apiClient.get("api/news?filter[order]=date DESC&filter[limit]=20")
  }
};