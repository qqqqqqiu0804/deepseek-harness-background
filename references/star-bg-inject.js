(function(){
  try{
    var KEY_A='dshStarAlpha', KEY_ON='dshStarOn', KEY_THEME='dshStarTheme', KEY_COLLAPSE='dshStarCollapse';
    var alpha=parseFloat(localStorage.getItem(KEY_A));
    if(isNaN(alpha)) alpha=0.45;
    var on=(localStorage.getItem(KEY_ON)!=='0');
    var theme=localStorage.getItem(KEY_THEME); // 'light' | 'dark' | null
    var moStarted=false, panel=null, openBtn=null;
    function getTheme(){ return theme || (document.body && document.body.hasAttribute('data-ds-dark-theme') ? 'dark':'light'); }
    function applyAlpha(){
      document.documentElement.style.setProperty('--star-alpha', alpha);
      if(document.body) document.body.classList.toggle('star-off', !on);
    }
    function applyTheme(){
      var t=getTheme();
      if(document.body) document.body.toggleAttribute('data-ds-dark-theme', t==='dark');
    }
    function controlInner(){
      return '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span style="font-weight:600">背景设置</span><span id="scClose" style="cursor:pointer;opacity:.7;font-size:16px;line-height:1;padding:0 2px">×</span></div>'+
        '<div style="display:flex;justify-content:space-between"><span>面板不透明度</span><span id="scVal"></span></div>'+
        '<input id="scRange" type="range" min="0" max="92" value="'+Math.round(alpha*100)+'" style="width:100%">'+
        '<label style="display:flex;align-items:center;gap:6px;margin-top:8px;cursor:pointer"><input id="scToggle" type="checkbox" '+(on?'checked':'')+'> 显示背景图</label>'+
        '<label style="display:flex;align-items:center;gap:6px;margin-top:6px;cursor:pointer"><input id="scDark" type="checkbox" '+(getTheme()==='dark'?'checked':'')+'> 深色模式</label>';
    }
    function cornerStyle(s){
      s.style.cssText='position:fixed;right:14px;bottom:14px;z-index:2147483647;background:rgba(20,20,22,.88);color:#fff;padding:12px 14px;border-radius:12px;font:13px/1.5 system-ui,-apple-system,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.45);width:210px;backdrop-filter:blur(8px)';
    }
    function inSettingsStyle(s){
      s.style.cssText='position:static;width:100%;margin:8px 0 18px;background:rgba(127,127,127,.14);color:inherit;padding:12px 14px;border-radius:10px;font:13px/1.5 system-ui,-apple-system,sans-serif;box-sizing:border-box';
    }
    function build(){
      if(panel) return;
      panel=document.createElement('div');
      panel.id='starCtrl';
      panel.innerHTML=controlInner();
      cornerStyle(panel);
      document.body.appendChild(panel);
      var r=panel.querySelector('#scRange'), v=panel.querySelector('#scVal'), t=panel.querySelector('#scToggle'), d=panel.querySelector('#scDark'), x=panel.querySelector('#scClose');
      function upd(){v.textContent=Math.round(alpha*100)+'%';}
      upd();
      r.addEventListener('input',function(){alpha=(+r.value)/100;localStorage.setItem(KEY_A,alpha);applyAlpha();upd();});
      t.addEventListener('change',function(){on=t.checked;localStorage.setItem(KEY_ON,on?'1':'0');applyAlpha();});
      d.addEventListener('change',function(){theme=d.checked?'dark':'light';localStorage.setItem(KEY_THEME,theme);applyTheme();});
      x.addEventListener('click',function(){panel.style.display='none';if(openBtn)openBtn.style.display='flex';localStorage.setItem(KEY_COLLAPSE,'1');});
      openBtn=document.createElement('div');
      openBtn.id='starCtrlOpen';
      openBtn.textContent='⚙';
      openBtn.title='背景设置';
      openBtn.style.cssText='position:fixed;right:14px;bottom:14px;z-index:2147483647;background:rgba(20,20,22,.88);color:#fff;width:38px;height:38px;border-radius:50%;display:none;align-items:center;justify-content:center;cursor:pointer;font-size:18px;box-shadow:0 6px 24px rgba(0,0,0,.45)';
      document.body.appendChild(openBtn);
      openBtn.addEventListener('click',function(){panel.style.display='';openBtn.style.display='none';localStorage.setItem(KEY_COLLAPSE,'0');});
      if(localStorage.getItem(KEY_COLLAPSE)==='1'){panel.style.display='none';openBtn.style.display='flex';}
      if(!moStarted){
        moStarted=true;
        try{
          new MutationObserver(function(){
            var t=getTheme();
            var cur=document.body.hasAttribute('data-ds-dark-theme')?'dark':'light';
            if(cur!==t) document.body.toggleAttribute('data-ds-dark-theme', t==='dark');
          }).observe(document.body,{attributes:true,attributeFilter:['data-ds-dark-theme']});
        }catch(e){}
      }
    }
    function findSettingsAnchor(){
      try{
        var heads=['Appearance','外观','设置','Preferences'];
        var nodes=document.querySelectorAll('h1,h2,h3,h4,header,section,li');
        for(var i=0;i<nodes.length;i++){
          var tx=(nodes[i].textContent||'').trim();
          for(var j=0;j<heads.length;j++){
            if(tx===heads[j] || tx.indexOf(heads[j])>=0){
              var host=nodes[i];
              for(var k=0;k<3 && host.parentElement;k++) host=host.parentElement;
              if(host && host!==document.body && host!==document.documentElement) return host;
            }
          }
        }
      }catch(e){}
      return null;
    }
    function placePanel(){
      if(!panel) return;
      var anchor=findSettingsAnchor();
      if(anchor){
        inSettingsStyle(panel);
        if(panel.parentNode!==anchor) anchor.insertBefore(panel, anchor.firstChild);
        if(openBtn) openBtn.style.display='none';
      } else {
        if(panel.style.display!=='none') cornerStyle(panel);
        if(panel.parentNode!==document.body) document.body.appendChild(panel);
        if(localStorage.getItem(KEY_COLLAPSE)==='1'){panel.style.display='none';if(openBtn)openBtn.style.display='flex';}
      }
    }
    applyAlpha();
    applyTheme();
    var n=0, iv=setInterval(function(){n++; if(document.body){applyAlpha();applyTheme();build();placePanel();} if(n>200) clearInterval(iv);},350);
  }catch(e){console.error('starCtrl',e);}
})();
