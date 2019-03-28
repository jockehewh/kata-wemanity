const jss = JSON.stringify
const jsp = JSON.parse
const x = m
const mews = io('ws://localhost:2019/katasocket')
const state = {
  one: false,
  two: false
}
let newProfile = {
  name: 'Xavier',
  lastname: "Bélénus",
  picture: 'somedata'
}
mews.emit('create-profile', jss(newProfile))

let theHomepage = {
  oninit: ()=>{
    state.one = true
  },
  view: ()=>{
    return x('div', [
      state.one ? x('p', "Paragraphe un") : null,
      state.two ? x('p', "Paragraphe deux") : null,
      x('button', {onclick: (e)=>{
        state.one = !state.one
        state.two = !state.two
       }
      } , "toggle")
    ])
  }
}
x.mount(document.body, theHomepage)