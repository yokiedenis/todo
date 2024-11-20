

let skip=0;
window.onload =generateTodos();

function generateTodos(){
  axios
  .get(`/read-item?skip=${skip}`)
  .then((res)=>{
    if(res.data.status!==200){
      alert(res.data.message);
      return;
    }
    const todos=res.data.data

    document.getElementById("item_list").insertAdjacentHTML(
      "beforeend",
      todos
      .map((item)=>{
        return `<li class="list-group-item >
        <span class="item-text"> ${item.todo}</span>
        <div>
        <button data-id="${item._id}" class="edit-me ">Edit</button>
        <button data-id="${item._id}" class="delete-me ">Delete</button>
        </div></li>`;
      }).join("")
    );

    skip+=todos.length;

    return;
  }).catch((err)=>{
    console.log(err);
    alert(err.message);
    return;
  });
}
const popup=document.getElementById("popup");
document.addEventListener("click",function(event){
  //edit
  if(event.target.classList.contains("edit-me")){
    const newData=prompt("Enter new Todo Text");
    const id=event.target.getAttribute("data-id");

    axios
    .post("/edit-item",{id,newData})
    .then((res)=>{
      if (res.data.status !== 200) {
        alert(res.data.message);
        return;
      }
      if (res.data.status === 200) {
        popup.classList.add("open-popup")
      }
//this is the code i tried so much to change the span but it turned out null
//so i use a pop up as a distraction for a refresh
event.target.parentElement.parentElement.querySelector(
  ".item-text"
).innerHTML = newData;

    }).catch((err)=>{
      console.log(err);
    });
  }

  //delete
  else if(event.target.classList.contains("delete-me")){
    const id=event.target.getAttribute("data-id");

    axios
    .post("/delete-item",{id})
    .then((res)=>{
      if(res.data.status !==200){
        alert(res.data.message);
        return;
      }
      console.log(res);
      event.target.parentElement.parentElement.remove();
      return;
    }).catch((err)=>{
      console.log(err);
    });
  }

  //add
  else if(event.target.classList.contains("add_item")){
    const todo=document.getElementById("create-field").ariaValueMax;

    axios
    .post("/create-item",{todo})
    .then((res)=>{
      if(res.data.status!==201){
        alert(res.data.message);
      }
      document.getElementById("item_list").insertAdjacentHTML(
        "beforeend",
        `<li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
                <span class="item-text"> ${res.data.data.todo}</span>
                <div>
                <button data-id="${res.data.data._id}" class="edit-me ">Edit</button>
                <button data-id="${res.data.data._id}" class="delete-me ">Delete</button>
                </div></li>`
      )
    })
    .catch((err)=>{
      console.log(err);
      
    });
  }

  //show more
  else if(event.target.classList.contains("show_more")){
    generateTodos();
  }
})

