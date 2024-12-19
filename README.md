## WebSite

https://www.fcc.gov/oet/ea/fccid
https://apps.fcc.gov/oetcf/eas/reports/GenericSearch.cfm
https://apps.fcc.gov/oetcf/eas/reports/GenericSearchResult.cfm?RequestTimeout=500


## wget  (not used)
wget --recursive --level=inf --no-parent --accept pdf -e robots=off -O - https://example.com | grep -oP 'https?://[^\s]+\.pdf' > pdf_links.txt

cat pdf_links.txt | parallel -j 10 curl -O

參數說明
-r (--recursive) 下載網址下的文件
-A * 指定下載文件格式
-nc (--no-clobber) 跳過已經下載的
-c 斷點續傳
-nd (-no-directories) 不下載目錄結構
-nH (--no-host-directories) 不建立以目標主機育名為目錄的資料夾

## Example


wget -r -l=2 -t 0 -c -np -nH -A '*.pdf' https://fccid.io/RRKEM060KALPHA

wget -r -A 'https://fccid.io/RRK.*.pdf' -c -np -nH  https://fccid.io/RRK/

wget -r -nd -A '.*pdf' -I RRKEM060KALPHA 'https://fccid.io/'

wget --spider -r -l1 https://fccid.io/

wget -r -nd -A '.*pdf' 'https://fccid.io/RRKEM060KALPHA'

wget -O - "https://fccid.io/RRKEM060KALPHA" | grep -oP 'https://fccid.io/RRK[^\s]*\.pdf' > pdf_links.txt
wget -i pdf_links.txt


