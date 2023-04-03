javascript: /*
SharePoint上のファイルパスを取得し、Markdown 形式の `[代替文字列](Hyperlink)` の文字列を表示するブックマークレット  

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

  let str_CurDirNameDecoded = `${str_siteName}/${str_serverRelativeUrl}`.replace('/', ' > ');
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
  if (0 < strarr_selectedItemNames.length){ /* 配列要素最後までの間は、行頭を`┗`で開始する */
    let str_selectionName = strarr_selectedItemNames[strarr_selectedItemNames.length - 1];
    let str_mkdnLink = strarr_mkdnLinkOfSelections[strarr_selectedItemNames.length - 1];
    strarr_mkdnLinks.push(`┗[${str_selectionName}](${str_mkdnLink})`);
  }

  let str_ans = strarr_mkdnLinks.join('  \r\n') + '  \r\n';
  prompt('Markdown 形式', str_ans); /* なぜかすべての行が表示されない場合がある */
  console.log(str_ans);

})();
