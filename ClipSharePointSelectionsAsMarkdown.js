javascript: /*
Bookmarklet that retrieves the file path on SharePoint and displays the `[anchor text](Hyperlink)` string in Markdown format. 

参考にしたページ -> `https://www.meganii.com/blog/2022/05/16/getting-document-path-in-share-point-by-bookmarklet/`
*/
(async () => {
  const selectedItems = [...document.querySelectorAll('div.is-selected')].map(x => x.ariaLabel.split(',')[0]);/* 選択中状態の <div> 要素配列を取得 */
  const htmlElem_selections = [...document.querySelectorAll('div.is-selected')]; /* 選択中のアイテムの HTML 要素を取得 */
  let strarr_selectedItemNames = []; /* 選択中状態のアイテム名配列 */

  /* 選択中状態のアイテム名配列を作成 */
  for (let int_cur = 0 ; int_cur < htmlElem_selections.length ; int_cur++){
    /* ラベル用 <div> 要素の取得 */
    /* `.iterateNext()` を挟まないと、HTML Element が取得できない*/
    /* なぜか `let` 宣言できない */
    var htmlElem_labelDiv = document.evaluate('div[position()=1]//div[position()=1]', htmlElem_selections[int_cur], null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null).iterateNext();
    strarr_selectedItemNames.push(htmlElem_labelDiv.getAttribute('aria-label'));
  }

  const str_siteName = location.pathname.split('/')[2];
  const str_docList = location.pathname.split('/')[3];
  const id = new URLSearchParams(location.search).get('id') || new URLSearchParams(location.search).get('RootFolder');
  const str_baseurl = `${location.origin}/sites/${str_siteName}`;                    /*  https://{tenant}/sites/{site name} */
  const str_serverRelativeUrl = id ? id.split('/').slice(3).join('/') : str_docList; /* `https://{tenant}/sites/{site name}/` 以降のパス */

  /* SharePoint REST Api のコール */
  /* これを使用している？ -> `https://learn.microsoft.com/ja-jp/dotnet/api/microsoft.sharepoint.client.web.getfolderbyserverrelativeurl?view=sharepoint-csom` */
  /* 参考になるか？ -> `https://ichiro-kun.com/post/509/` */
  const str_urlForApiCall = `${str_baseurl}/_api/web/GetFolderByServerRelativeUrl('${str_serverRelativeUrl}')/Files`;
  const response = await fetch(str_urlForApiCall, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json;odata=verbose'
    }
  });
  const dict_files = await response.json();

  /* デバッグ用表示 */
  /*console.log(JSON.stringify(dict_files, null, "    "));*/

  let str_CurDirNameDecoded = `${str_siteName}/${str_serverRelativeUrl}`.replace(/\//g, ' > ');
  let str_CurDirNameEncoded = encodeURI(`${str_baseurl}/${str_serverRelativeUrl}`);
  let strarr_mkdnLinks = [];

  let strarr_mkdnLinkOfSelections = [];
  strarr_mkdnLinks.push(`[${str_CurDirNameDecoded}](${str_CurDirNameEncoded})`);

  for (let int_selectIdx = 0 ; int_selectIdx < strarr_selectedItemNames.length ; int_selectIdx++){
    
    let str_subj = strarr_selectedItemNames[int_selectIdx];
    let bl_found = false; /* 選択アイテムがレスポンスオブジェクトに存在するかどうか */

    /* 選択アイテムがレスポンスオブジェクトに存在するかどうか検索 */
    for (let dict_result of dict_files.d.results) {
      if (str_subj === dict_result.Name){
        bl_found = true;
        if(dict_result.LinkingUri){ /* `LinkingUri` 要素が null でなければ */
          strarr_mkdnLinkOfSelections.push(encodeURI(dict_result.LinkingUrl));
        }else{ /* `LinkingUri` 要素が null の場合 */
          strarr_mkdnLinkOfSelections.push(encodeURI(`${str_baseurl}/${str_serverRelativeUrl}/` + str_subj));
          /* ここで取得できる `ServerRelativeUrl` は、`https://{tenant}/` 以降のパス */
        }
      }
    }
    if (!bl_found) { /* 選択アイテムがレスポンスオブジェクトに存在しなかった場合 -> ディレクトリの場合 */
      strarr_mkdnLinkOfSelections.push(encodeURI(`${str_baseurl}/${str_serverRelativeUrl}/` + str_subj));
    }
  }

  /* Markdown 文字列の作成 */
  for (let int_selectIdx = 0 ; int_selectIdx < strarr_selectedItemNames.length - 1 ; int_selectIdx++){ /* 配列要素最後 - 1 までの間は、行頭を`┣`で開始する */
    let str_selectionName = strarr_selectedItemNames[int_selectIdx];
    let str_mkdnLink = strarr_mkdnLinkOfSelections[int_selectIdx];
    strarr_mkdnLinks.push(`┣[${str_selectionName}](${str_mkdnLink})`);
  }
  if (0 < strarr_selectedItemNames.length){ /* 配列要素最後は、行頭を`┗`で開始する */
    let str_selectionName = strarr_selectedItemNames[strarr_selectedItemNames.length - 1];
    let str_mkdnLink = strarr_mkdnLinkOfSelections[strarr_selectedItemNames.length - 1];
    strarr_mkdnLinks.push(`┗[${str_selectionName}](${str_mkdnLink})`);
  }

  let str_ans = strarr_mkdnLinks.join('  \r\n') + '  \r\n';

  /* <モーダルの表示>--------------------------------------------------------------------------- */

  /* 一意 id の作成 */
  let str_uniqueIDForModalDiv = 'WNDhs8zhd8g80hEHG0l';
  let int_dupTimes = 0;
  let str_uniqueIDForModalDiv_PossibilityOfDuplicate = str_uniqueIDForModalDiv + '_' + String(int_dupTimes);
  while(document.getElementById(str_uniqueIDForModalDiv_PossibilityOfDuplicate)){
    str_uniqueIDForModalDiv_PossibilityOfDuplicate = str_uniqueIDForModalDiv + '_' + String(++int_dupTimes);
  }
  str_uniqueIDForModalDiv = str_uniqueIDForModalDiv_PossibilityOfDuplicate; /* 一意 id の格納 */

  /* モーダル用 <div> 要素の innerHTML 文字列 */
  /* todo なぜか最終行の改行が表示 & コピーされない */
  /* todo <Button> 要素に `type="submit"` を指定しても、 `autofocus` を指定しても、、フォーカスされない */
  const str_innerHTML = 
`<div class="modal-overlay js-modal-close" style="user-select: text; align-items: center; background: rgba(0, 0, 0, .75); bottom: 0; display: flex; justify-content: center; left: 0; position: fixed; right: 0; top: 0; color: #000000">
  <div class="modal-container" style="background: #fff; border-radius: 4px; max-height: 100%; max-width: ${document.documentElement.clientWidth * 0.8}px; padding: 30px 20px; overflow: scroll;">
    <div class="modal-content">
      <h2 class="modal-content-ttl">Press OK to copy to clipboard <button class="modal-btn modal-close js-modal-close" style="border: none; border-radius: 4px; color: #fff; cursor: pointer; font-size: 1rem; padding: 10px 20px; background: darkblue;">OK</button></h2>
      <pre class="modal-content-txt">${str_ans}</pre>
    </div><!-- /.modal-content -->
  </div><!-- /.modal-container -->
</div><!-- /.modal-overlay -->`;

  let HtmlElem_modalDiv = document.createElement('div');
  HtmlElem_modalDiv.setAttribute('id', str_uniqueIDForModalDiv);
  HtmlElem_modalDiv.style.opacity = 0;
  document.body.appendChild(HtmlElem_modalDiv); /* モーダル用 <div> 要素を追加 */

  HtmlElem_modalDiv.innerHTML = str_innerHTML;
  const htmlElem_pre = document.evaluate('div[position()=1]/div[position()=1]/div[position()=1]/pre', HtmlElem_modalDiv, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null).iterateNext();
  htmlElem_pre.innerHTML = str_ans;
  
  const int_trainsitionMS = 200; /* transition time [ms] */
  HtmlElem_modalDiv.style.transition = 'opacity ' + int_trainsitionMS + 'ms';
  
  HtmlElem_modalDiv.style.display = "block";
  HtmlElem_modalDiv.style.opacity = 1;

  /* --------------------------------------------------------------------------</モーダルの表示> */

  /* <クリップボードコピー用 Event Lisner>------------------------------------------------------ */
  const htmlElem_okButton = document.evaluate('div[position()=1]/div[position()=1]/div[position()=1]/h2/button', HtmlElem_modalDiv, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null).iterateNext();
  htmlElem_okButton.addEventListener('click', (obj_event) => {
    var range = document.createRange(); 
    range.selectNodeContents(htmlElem_pre); 
    var obj_selection = window.getSelection();
    obj_selection.removeAllRanges();
    obj_selection.addRange(range); 
    document.execCommand('copy'); 
    /* <for IE 11 only> */
    try{
        window.clipboardData.setData('text', htmlElem_pre.innerHTML);
    }catch(e){
        /* nothing to do */
    }
    /* </for IE 11 only> */
  });
  /* -----------------------------------------------------</クリップボードコピー用 Event Lisner> */

  /* <モーダル非表示用 Event Lister>------------------------------------------------------------ */
  let modalClose = document.querySelectorAll('.js-modal-close');
    for (let i = 0; i < modalClose.length; i++){
    modalClose[i].addEventListener('click', (e) => {
      HtmlElem_modalDiv.style.opacity = 0;
      HtmlElem_modalDiv.emove();
      e.stopPropagation();
    });
  }
  /* モーダル外もしくは「OK」ボタンのクリック以外は、'click' イベントを上位の要素に伝搬させない */
  const htmlElem_ContainerDiv = document.evaluate('div[position()=1]/div[position()=1]', HtmlElem_modalDiv, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null).iterateNext();
  htmlElem_ContainerDiv.addEventListener('click', (e) => {
    e.stopPropagation();
  });
  /* -----------------------------------------------------------</モーダル非表示用 Event Lister> */

})();
