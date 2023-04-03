<# License>------------------------------------------------------------

 Copyright (c) 2023 Shinnosuke Yakenohara

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>

-----------------------------------------------------------</License #>

#
# <CAUTION>
# この .ps1 スクリプトファイル自体のテキストエンコードは、
# UTF-8 (※BOM有り※) としておかないと、文字 `┗`  が化けてしまう
# </CAUTION>
#

#変数宣言
$opDebug = "/d" #デバッグモード指定文字列

# Option 確認ループ
$isDebug = $FALSE
$mxOfArgs = $Args.count
for ($idx = 0 ; $idx -lt $mxOfArgs ; $idx++){
    
    if($Args[$idx] -eq $opDebug){ #デバッグ指定の場合
        $isDebug = $TRUE
    }
}

#クリップボードからテキストを取得
$clipText = Get-Clipboard -Format Text

# 取得したモノがTextかどうかチェック
$nullOrEmpty = [String]::IsNullOrEmpty($clipText)
if($nullOrEmpty){ #Text でない場合
    exit #終了
}

$str_lines = $clipText.Replace("`r`n", "`n")
$str_lines = $str_lines.Replace("`r", "`n")
$str_lines = $str_lines.Split("`n")

# HttpUtilityクラス の有効化
Add-Type -AssemblyName System.Web

$str_toSearch = "/sites/"

# 親ディレクトリ処理
$str_decoded = [System.Web.HttpUtility]::UrlDecode($str_lines[0]) # パーセントエンコーディングされた文字列をでコード
$int_substrStart = $str_decoded.IndexOf($str_toSearch) + $str_toSearch.Length
$int_lastIndexOfSlash = $str_decoded.LastIndexOf('/')
$int_substrCount = $int_lastIndexOfSlash - $int_substrStart
$str_parentDirName = $str_decoded.Substring($int_substrStart , $int_substrCount).Replace("/", " > ")
$str_parentPathName = $str_lines[0].Substring(0, $str_lines[0].LastIndexOf("/"))
$str_parentDirNameWithUrl = "[" + $str_parentDirName + "](" + $str_parentPathName + ")  "
    
# ファイル
$str_fileName = $str_decoded.Substring($int_lastIndexOfSlash + 1, $str_decoded.Length - $int_lastIndexOfSlash - 1)
$str_fileNameWithUrl = "┗[" + $str_fileName + "](" + $str_lines[1] + ")  "

#変換結果をクリップボードに保存
Set-Clipboard ($str_parentDirNameWithUrl + "`r`n" + $str_fileNameWithUrl)

if($isDebug){
    Read-Host "Press Enter key to continue..."
}
