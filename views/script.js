var socket = io.connect()
var whoiscall
socket.on("connected",function(){
console.log("socket connected");
return "a"
})
socket.on("requestcall",whoiscalling=>{
    console.log(whoiscalling)

    document.getElementById("caller").innerHTML=whoiscalling   //on incoming call
    document.getElementById("displaypopup").click()

})

function requestcall(e){
    console.log(e)         
    document.getElementById("tocall").value=e        
    document.getElementById("formid").action+='#init'
    document.getElementById("formid").submit()
   
    
}
function acceptcall(e){
    console.log(e)         
    document.getElementById("tocall").value=e        

    document.getElementById("formid").submit()
    
}
socket.on("callaccepted",function(){
alert("callaccepted")
})
socket.on("callrejected",function(){
alert("callrejected")
})


socket.on("clientoffline",function(){
alert("client offline")
})
socket.on("peerid",(pid)=>{
    peer.signal(pid)
})