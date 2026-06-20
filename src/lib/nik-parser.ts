/**
 * NIK Indonesia Parser
 *
 * NIK (Nomor Induk Kependudukan) Indonesia berisi 16 digit:
 * - Digit 1-2: Kode provinsi (Kemendagri)
 * - Digit 3-4: Kode kabupaten/kota
 * - Digit 5-6: Kode kecamatan
 * - Digit 7-8: Tanggal lahir (1-31 L, 41-71 P)
 * - Digit 9-10: Bulan lahir (01-12)
 * - Digit 11-12: Tahun lahir (2 digit)
 * - Digit 13-16: Nomor urut
 *
 * Sumber: Permendagri 137/2017 (provinsi + kabupaten)
 *         Kemendagri 2021 (kecamatan, 7094 entries via kecamatan-data.ts)
 */

import { getKecamatanName } from "./kecamatan-data";

export interface ParsedNIK {
  isValid: boolean;
  errors: string[];
  provinsiCode?: string;
  provinsiName?: string;
  kabupatenCode?: string;
  kabupatenName?: string;
  kecamatanCode?: string;
  kecamatanName?: string;
  tanggalLahir?: number;
  bulanLahir?: number;
  tahunLahir?: number;
  jenisKelamin?: "LAKI-LAKI" | "PEREMPUAN";
  tanggalLahirISO?: string;
  nomorUrut?: string;
}

export const PROVINSI_MAP: Record<string, string> = {
  "11": "ACEH",
  "12": "SUMATERA UTARA",
  "13": "SUMATERA BARAT",
  "14": "RIAU",
  "15": "JAMBI",
  "16": "SUMATERA SELATAN",
  "17": "BENGKULU",
  "18": "LAMPUNG",
  "19": "KEPULAUAN BANGKA BELITUNG",
  "21": "KEPULAUAN RIAU",
  "31": "DKI JAKARTA",
  "32": "JAWA BARAT",
  "33": "JAWA TENGAH",
  "34": "DI YOGYAKARTA",
  "35": "JAWA TIMUR",
  "36": "BANTEN",
  "51": "BALI",
  "52": "NUSA TENGGARA BARAT",
  "53": "NUSA TENGGARA TIMUR",
  "61": "KALIMANTAN BARAT",
  "62": "KALIMANTAN TENGAH",
  "63": "KALIMANTAN SELATAN",
  "64": "KALIMANTAN TIMUR",
  "65": "KALIMANTAN UTARA",
  "71": "SULAWESI UTARA",
  "72": "SULAWESI TENGAH",
  "73": "SULAWESI SELATAN",
  "74": "SULAWESI TENGGARA",
  "75": "GORONTALO",
  "76": "SULAWESI BARAT",
  "81": "MALUKU",
  "82": "MALUKU UTARA",
  "91": "PAPUA",
  "92": "PAPUA BARAT",
};

export const KABUPATEN_MAP: Record<string, string> = {
  "1101": "KAB. ACEH SELATAN",
  "1102": "KAB. ACEH TENGGARA",
  "1103": "KAB. ACEH TIMUR",
  "1104": "KAB. ACEH TENGAH",
  "1105": "KAB. ACEH BARAT",
  "1106": "KAB. ACEH BESAR",
  "1107": "KAB. PIDIE",
  "1108": "KAB. ACEH JAYA",
  "1109": "KAB. NAGAN RAYA",
  "1110": "KAB. ACEH UTARA",
  "1111": "KAB. BIREUEN",
  "1112": "KAB. ACEH BARAT DAYA",
  "1113": "KAB. GAYO LUES",
  "1114": "KAB. ACEH TAMIANG",
  "1115": "KAB. BENER MERIAH",
  "1116": "KAB. PIDIE JAYA",
  "1171": "KOTA BANDA ACEH",
  "1172": "KOTA SABANG",
  "1173": "KOTA LHOKSEUMAWE",
  "1174": "KOTA LANGSA",
  "1175": "KOTA SUBULUSSALAM",
  "1201": "KAB. TAPANULI TENGAH",
  "1202": "KAB. TAPANULI UTARA",
  "1203": "KAB. TAPANULI SELATAN",
  "1204": "KAB. NIAS",
  "1205": "KAB. LANGKAT",
  "1206": "KAB. KARO",
  "1207": "KAB. DELI SERDANG",
  "1208": "KAB. SIMALUNGUN",
  "1209": "KAB. ASAHAN",
  "1210": "KAB. LABUHANBATU",
  "1211": "KAB. DAIRI",
  "1212": "KAB. TOBA SAMOSIR",
  "1213": "KAB. MANDAILING NATAL",
  "1214": "KAB. NIAS SELATAN",
  "1215": "KAB. PAKPAK BHARAT",
  "1216": "KAB. HUMBANG HASUNDUTAN",
  "1217": "KAB. SAMOSIR",
  "1218": "KAB. SERDANG BEDAGAI",
  "1219": "KAB. BATU BARA",
  "1220": "KAB. PADANG LAWAS UTARA",
  "1221": "KAB. PADANG LAWAS",
  "1222": "KAB. LABUHANBATU SELATAN",
  "1223": "KAB. LABUHANBATU UTARA",
  "1224": "KAB. NIAS UTARA",
  "1225": "KAB. NIAS BARAT",
  "1271": "KOTA MEDAN",
  "1272": "KOTA PEMATANGSIANTAR",
  "1273": "KOTA SIBOLGA",
  "1274": "KOTA TANJUNG BALAI",
  "1275": "KOTA BINJAI",
  "1276": "KOTA TEBING TINGGI",
  "1277": "KOTA PADANG SIDEMPUAN",
  "1278": "KOTA GUNUNGSITOLI",
  "1301": "KAB. KEPULAUAN MENTAWAI",
  "1302": "KAB. PESISIR SELATAN",
  "1303": "KAB. SOLOK",
  "1304": "KAB. SIJUNJUNG",
  "1305": "KAB. TANAH DATAR",
  "1306": "KAB. PADANG PARIAMAN",
  "1307": "KAB. AGAM",
  "1308": "KAB. LIMA PULUH KOTA",
  "1309": "KAB. PASAMAN",
  "1310": "KAB. SOLOK SELATAN",
  "1311": "KAB. DHARMASRAYA",
  "1312": "KAB. PASAMAN BARAT",
  "1371": "KOTA PADANG",
  "1372": "KOTA SOLOK",
  "1373": "KOTA SAWAHLUNTO",
  "1374": "KOTA PADANG PANJANG",
  "1375": "KOTA BUKITTINGGI",
  "1376": "KOTA PAYAKUMBUH",
  "1377": "KOTA PARIAMAN",
  "1401": "KAB. KUANTAN SINGINGI",
  "1402": "KAB. INDRAGIRI HULU",
  "1403": "KAB. INDRAGIRI HILIR",
  "1404": "KAB. PELALAWAN",
  "1405": "KAB. SIAK",
  "1406": "KAB. KAMPAR",
  "1407": "KAB. ROKAN HULU",
  "1408": "KAB. BENGKALIS",
  "1409": "KAB. ROKAN HILIR",
  "1410": "KAB. KEPULAUAN MERANTI",
  "1471": "KOTA PEKANBARU",
  "1472": "KOTA DUMAI",
  "1501": "KAB. KERINCI",
  "1502": "KAB. MERANGIN",
  "1503": "KAB. SAROLANGUN",
  "1504": "KAB. BATANG HARI",
  "1505": "KAB. MUARO JAMBI",
  "1506": "KAB. TANJUNG JABUNG BARAT",
  "1507": "KAB. TANJUNG JABUNG TIMUR",
  "1508": "KAB. BUNGO",
  "1509": "KAB. TEBO",
  "1571": "KOTA JAMBI",
  "1601": "KAB. OGAN KOMERING ULU",
  "1602": "KAB. OGAN KOMERING ILIR",
  "1603": "KAB. MUARA ENIM",
  "1604": "KAB. LAHAT",
  "1605": "KAB. MUSI RAWAS",
  "1606": "KAB. MUSI BANYUASIN",
  "1607": "KAB. BANYUASIN",
  "1608": "KAB. OGAN KOMERING ULU SELATAN",
  "1609": "KAB. OGAN KOMERING ULU TIMUR",
  "1610": "KAB. EMPAT LAWANG",
  "1611": "KAB. PENUKAL ABAB LEMATANG ILIR",
  "1612": "KAB. MUSI RAWAS UTARA",
  "1671": "KOTA PALEMBANG",
  "1672": "KOTA PRABUMULIH",
  "1673": "KOTA PAGAR ALAM",
  "1674": "KOTA LUBUKLINGGAU",
  "1701": "KAB. BENGKULU SELATAN",
  "1702": "KAB. REJANG LEBONG",
  "1703": "KAB. BENGKULU UTARA",
  "1704": "KAB. KAUR",
  "1705": "KAB. SELUMA",
  "1706": "KAB. MUKO MUKO",
  "1707": "KAB. LEBONG",
  "1708": "KAB. KEPAHIANG",
  "1709": "KAB. BENGKULU TENGAH",
  "1771": "KOTA BENGKULU",
  "1801": "KAB. LAMPUNG SELATAN",
  "1802": "KAB. LAMPUNG TENGAH",
  "1803": "KAB. LAMPUNG UTARA",
  "1804": "KAB. LAMPUNG BARAT",
  "1805": "KAB. TULANG BAWANG",
  "1806": "KAB. TANGGAMUS",
  "1807": "KAB. LAMPUNG TIMUR",
  "1808": "KAB. WAY KANAN",
  "1809": "KAB. PESAWARAN",
  "1810": "KAB. PRINGSEWU",
  "1811": "KAB. MESUJI",
  "1812": "KAB. TULANG BAWANG BARAT",
  "1813": "KAB. PESISIR BARAT",
  "1871": "KOTA BANDAR LAMPUNG",
  "1872": "KOTA METRO",
  "1901": "KAB. BANGKA",
  "1902": "KAB. BELITUNG",
  "1903": "KAB. BANGKA BARAT",
  "1904": "KAB. BANGKA TENGAH",
  "1905": "KAB. BANGKA SELATAN",
  "1906": "KAB. BELITUNG TIMUR",
  "1971": "KOTA PANGKAL PINANG",
  "2101": "KAB. BINTAN",
  "2102": "KAB. KARIMUN",
  "2103": "KAB. NATUNA",
  "2104": "KAB. LINGGA",
  "2105": "KAB. KEPULAUAN ANAMBAS",
  "2171": "KOTA BATAM",
  "2172": "KOTA TANJUNG PINANG",
  "3171": "KOTA JAKARTA SELATAN",
  "3172": "KOTA JAKARTA TIMUR",
  "3173": "KOTA JAKARTA PUSAT",
  "3174": "KOTA JAKARTA BARAT",
  "3175": "KOTA JAKARTA UTARA",
  "3176": "KOTA KEPULAUAN SERIBU",
  "3201": "KAB. BOGOR",
  "3202": "KAB. SUKABUMI",
  "3203": "KAB. CIANJUR",
  "3204": "KAB. BANDUNG",
  "3205": "KAB. GARUT",
  "3206": "KAB. TASIKMALAYA",
  "3207": "KAB. CIAMIS",
  "3208": "KAB. KUNINGAN",
  "3209": "KAB. CIREBON",
  "3210": "KAB. MAJALENGKA",
  "3211": "KAB. SUMEDANG",
  "3212": "KAB. INDRAMAYU",
  "3213": "KAB. SUBANG",
  "3214": "KAB. PURWAKARTA",
  "3215": "KAB. KARAWANG",
  "3216": "KAB. BEKASI",
  "3217": "KAB. BANDUNG BARAT",
  "3218": "KAB. PANGANDARAN",
  "3271": "KOTA BOGOR",
  "3272": "KOTA SUKABUMI",
  "3273": "KOTA BANDUNG",
  "3274": "KOTA CIREBON",
  "3275": "KOTA BEKASI",
  "3276": "KOTA DEPOK",
  "3277": "KOTA CIMAHI",
  "3278": "KOTA TASIKMALAYA",
  "3279": "KOTA BANJAR",
  "3301": "KAB. CILACAP",
  "3302": "KAB. BANYUMAS",
  "3303": "KAB. PURBALINGGA",
  "3304": "KAB. BANJARNEGARA",
  "3305": "KAB. KEBUMEN",
  "3306": "KAB. PURWOREJO",
  "3307": "KAB. WONOSOBO",
  "3308": "KAB. MAGELANG",
  "3309": "KAB. BOYOLALI",
  "3310": "KAB. KLATEN",
  "3311": "KAB. SUKOHARJO",
  "3312": "KAB. WONOGIRI",
  "3313": "KAB. KARANGANYAR",
  "3314": "KAB. SRAGEN",
  "3315": "KAB. GROBOGAN",
  "3316": "KAB. BLORA",
  "3317": "KAB. REMBANG",
  "3318": "KAB. PATI",
  "3319": "KAB. KUDUS",
  "3320": "KAB. JEPARA",
  "3321": "KAB. DEMAK",
  "3322": "KAB. SEMARANG",
  "3323": "KAB. TEMANGGUNG",
  "3324": "KAB. KENDAL",
  "3325": "KAB. BATANG",
  "3326": "KAB. PEKALONGAN",
  "3327": "KAB. PEMALANG",
  "3328": "KAB. TEGAL",
  "3329": "KAB. BREBES",
  "3371": "KOTA MAGELANG",
  "3372": "KOTA SURAKARTA",
  "3373": "KOTA SALATIGA",
  "3374": "KOTA SEMARANG",
  "3375": "KOTA PEKALONGAN",
  "3376": "KOTA TEGAL",
  "3401": "KAB. KULON PROGO",
  "3402": "KAB. BANTUL",
  "3403": "KAB. GUNUNG KIDUL",
  "3404": "KAB. SLEMAN",
  "3471": "KOTA YOGYAKARTA",
  "3501": "KAB. PACITAN",
  "3502": "KAB. PONOROGO",
  "3503": "KAB. TRENGGALEK",
  "3504": "KAB. TULUNGAGUNG",
  "3505": "KAB. BLITAR",
  "3506": "KAB. KEDIRI",
  "3507": "KAB. MALANG",
  "3508": "KAB. LUMAJANG",
  "3509": "KAB. JEMBER",
  "3510": "KAB. BANYUWANGI",
  "3511": "KAB. BONDOWOSO",
  "3512": "KAB. SITUBONDO",
  "3513": "KAB. PROBOLINGGO",
  "3514": "KAB. PASURUAN",
  "3515": "KAB. SIDOARJO",
  "3516": "KAB. MOJOKERTO",
  "3517": "KAB. JOMBANG",
  "3518": "KAB. NGANJUK",
  "3519": "KAB. MADIUN",
  "3520": "KAB. MAGETAN",
  "3521": "KAB. NGAWI",
  "3522": "KAB. BOJONEGORO",
  "3523": "KAB. TUBAN",
  "3524": "KAB. LAMONGAN",
  "3525": "KAB. GRESIK",
  "3526": "KAB. BANGKALAN",
  "3527": "KAB. SAMPANG",
  "3528": "KAB. PAMEKASAN",
  "3529": "KAB. SUMENEP",
  "3571": "KOTA KEDIRI",
  "3572": "KOTA BLITAR",
  "3573": "KOTA MALANG",
  "3574": "KOTA PROBOLINGGO",
  "3575": "KOTA PASURUAN",
  "3576": "KOTA MOJOKERTO",
  "3577": "KOTA MADIUN",
  "3578": "KOTA SURABAYA",
  "3579": "KOTA BATU",
  "3601": "KAB. PANDEGLANG",
  "3602": "KAB. LEBAK",
  "3603": "KAB. TANGERANG",
  "3604": "KAB. SERANG",
  "3671": "KOTA TANGERANG",
  "3672": "KOTA CILEGON",
  "3673": "KOTA SERANG",
  "3674": "KOTA TANGERANG SELATAN",
  "5101": "KAB. JEMBRANA",
  "5102": "KAB. TABANAN",
  "5103": "KAB. BADUNG",
  "5104": "KAB. GIANYAR",
  "5105": "KAB. KLUNGKUNG",
  "5106": "KAB. BANGLI",
  "5107": "KAB. KARANGASEM",
  "5108": "KAB. BULELENG",
  "5171": "KOTA DENPASAR",
  "5201": "KAB. LOMBOK BARAT",
  "5202": "KAB. LOMBOK TENGAH",
  "5203": "KAB. LOMBOK TIMUR",
  "5204": "KAB. SUMBAWA",
  "5205": "KAB. DOMPU",
  "5206": "KAB. BIMA",
  "5207": "KAB. SUMBAWA BARAT",
  "5208": "KAB. LOMBOK UTARA",
  "5271": "KOTA MATARAM",
  "5272": "KOTA BIMA",
  "5301": "KAB. KUPANG",
  "5302": "KAB. TIMOR TENGAH SELATAN",
  "5303": "KAB. TIMOR TENGAH UTARA",
  "5304": "KAB. BELU",
  "5305": "KAB. ALOR",
  "5306": "KAB. FLORES TIMUR",
  "5307": "KAB. SIKKA",
  "5308": "KAB. ENDE",
  "5309": "KAB. NGADA",
  "5310": "KAB. MANGGARAI",
  "5311": "KAB. SUMBA TIMUR",
  "5312": "KAB. SUMBA BARAT",
  "5313": "KAB. LEMBATA",
  "5314": "KAB. ROTE NDAO",
  "5315": "KAB. MANGGARAI BARAT",
  "5316": "KAB. NAGEKEO",
  "5317": "KAB. SUMBA TENGAH",
  "5318": "KAB. SUMBA BARAT DAYA",
  "5319": "KAB. MANGGARAI TIMUR",
  "5320": "KAB. SABU RAIJUA",
  "5321": "KAB. MALAKA",
  "5371": "KOTA KUPANG",
  "6101": "KAB. SAMBAS",
  "6102": "KAB. MEMPAWAH",
  "6103": "KAB. SANGGAU",
  "6104": "KAB. KETAPANG",
  "6105": "KAB. SINTANG",
  "6106": "KAB. KAPUAS HULU",
  "6107": "KAB. BENGKAYANG",
  "6108": "KAB. LANDAK",
  "6109": "KAB. SEKADAU",
  "6110": "KAB. MELAWI",
  "6111": "KAB. KAYONG UTARA",
  "6112": "KAB. KUBU RAYA",
  "6171": "KOTA PONTIANAK",
  "6172": "KOTA SINGKAWANG",
  "6201": "KAB. KOTAWARINGIN BARAT",
  "6202": "KAB. KOTAWARINGIN TIMUR",
  "6203": "KAB. KAPUAS",
  "6204": "KAB. BARITO SELATAN",
  "6205": "KAB. BARITO UTARA",
  "6206": "KAB. KATINGAN",
  "6207": "KAB. SERUYAN",
  "6208": "KAB. SUKAMARA",
  "6209": "KAB. LAMANDAU",
  "6210": "KAB. GUNUNG MAS",
  "6211": "KAB. PULANG PISAU",
  "6212": "KAB. MURUNG RAYA",
  "6213": "KAB. BARITO TIMUR",
  "6271": "KOTA PALANGKA RAYA",
  "6301": "KAB. TANAH LAUT",
  "6302": "KAB. KOTABARU",
  "6303": "KAB. BANJAR",
  "6304": "KAB. BARITO KUALA",
  "6305": "KAB. TAPIN",
  "6306": "KAB. HULU SUNGAI SELATAN",
  "6307": "KAB. HULU SUNGAI TENGAH",
  "6308": "KAB. HULU SUNGAI UTARA",
  "6309": "KAB. TABALONG",
  "6310": "KAB. TANAH BUMBU",
  "6311": "KAB. BALANGAN",
  "6371": "KOTA BANJARMASIN",
  "6372": "KOTA BANJARBARU",
  "6401": "KAB. PASER",
  "6402": "KAB. KUTAI KARTANEGARA",
  "6403": "KAB. BERAU",
  "6407": "KAB. KUTAI BARAT",
  "6408": "KAB. KUTAI TIMUR",
  "6409": "KAB. MAHAKAM ULU",
  "6471": "KOTA BALIKPAPAN",
  "6472": "KOTA SAMARINDA",
  "6474": "KOTA BONTANG",
  "6501": "KAB. BULUNGAN",
  "6502": "KAB. MALINAU",
  "6503": "KAB. NUNUKAN",
  "6504": "KAB. TANA TIDUNG",
  "6571": "KOTA TARAKAN",
  "7101": "KAB. BOLAANG MONGONDOW",
  "7102": "KAB. MINAHASA",
  "7103": "KAB. KEPULAUAN SANGIHE",
  "7104": "KAB. KEPULAUAN TALAUD",
  "7105": "KAB. MINAHASA SELATAN",
  "7106": "KAB. MINAHASA UTARA",
  "7107": "KAB. BOLAANG MONGONDOW UTARA",
  "7108": "KAB. KEPULAUAN SIAU TAGULANDANG BIARO",
  "7109": "KAB. BOLAANG MONGONDOW SELATAN",
  "7110": "KAB. BOLAANG MONGONDOW TIMUR",
  "7171": "KOTA MANADO",
  "7172": "KOTA BITUNG",
  "7173": "KOTA TOMOHON",
  "7174": "KOTA KOTAMOBAGU",
  "7201": "KAB. BANGGAI",
  "7202": "KAB. MOROWALI",
  "7203": "KAB. POSO",
  "7204": "KAB. DONGGALA",
  "7205": "KAB. TOLI-TOLI",
  "7206": "KAB. BUOL",
  "7207": "KAB. PARIGI MOUTONG",
  "7208": "KAB. TOJO UNA-UNA",
  "7209": "KAB. SIGI",
  "7210": "KAB. BANGGAI KEPULAUAN",
  "7211": "KAB. MOROWALI UTARA",
  "7271": "KOTA PALU",
  "7301": "KAB. KEPULAUAN SELAYAR",
  "7302": "KAB. BULUKUMBA",
  "7303": "KAB. BANTAENG",
  "7304": "KAB. JENEPONTO",
  "7305": "KAB. TAKALAR",
  "7306": "KAB. GOWA",
  "7307": "KAB. SINJAI",
  "7308": "KAB. BONE",
  "7309": "KAB. MAROS",
  "7310": "KAB. PANGKAJENE DAN KEPULAUAN",
  "7311": "KAB. BARRU",
  "7312": "KAB. SOPPENG",
  "7313": "KAB. WAJO",
  "7314": "KAB. SIDENRENG RAPPANG",
  "7315": "KAB. PINRANG",
  "7316": "KAB. ENREKANG",
  "7317": "KAB. LUWU",
  "7318": "KAB. TANA TORAJA",
  "7319": "KAB. LUWU UTARA",
  "7320": "KAB. LUWU TIMUR",
  "7321": "KAB. TORAJA UTARA",
  "7371": "KOTA MAKASSAR",
  "7372": "KOTA PAREPARE",
  "7373": "KOTA PALOPO",
  "7401": "KAB. KOLAKA",
  "7402": "KAB. KONAWE",
  "7403": "KAB. MUNA",
  "7404": "KAB. BUTON",
  "7405": "KAB. KONAWE SELATAN",
  "7406": "KAB. BOMBANA",
  "7407": "KAB. WAKATOBI",
  "7408": "KAB. KOLAKA UTARA",
  "7409": "KAB. KONAWE UTARA",
  "7410": "KAB. BUTON UTARA",
  "7411": "KAB. MUNA BARAT",
  "7412": "KAB. BUTON TENGAH",
  "7413": "KAB. BUTON SELATAN",
  "7471": "KOTA KENDARI",
  "7472": "KOTA BAUBAU",
  "7501": "KAB. BOALEMO",
  "7502": "KAB. GORONTALO",
  "7503": "KAB. POHUWATO",
  "7504": "KAB. BONE BOLANGO",
  "7505": "KAB. GORONTALO UTARA",
  "7571": "KOTA GORONTALO",
  "7601": "KAB. MAMUJU UTARA",
  "7602": "KAB. MAMUJU",
  "7603": "KAB. MAMASA",
  "7604": "KAB. POLEWALI MAMASA",
  "7605": "KAB. MAJENE",
  "7606": "KAB. BONE",
  "7671": "KOTA MAMUJU",
  "8101": "KAB. MALUKU TENGAH",
  "8102": "KAB. MALUKU TENGGARA",
  "8103": "KAB. MALUKU TENGGARA BARAT",
  "8104": "KAB. BURU",
  "8105": "KAB. SERAM BAGIAN TIMUR",
  "8106": "KAB. SERAM BAGIAN BARAT",
  "8107": "KAB. KEPULAUAN ARU",
  "8108": "KAB. MALUKU BARAT DAYA",
  "8109": "KAB. BURU SELATAN",
  "8171": "KOTA AMBON",
  "8172": "KOTA TUAL",
  "8201": "KAB. HALMAHERA BARAT",
  "8202": "KAB. HALMAHERA TENGAH",
  "8203": "KAB. HALMAHERA TIMUR",
  "8204": "KAB. HALMAHERA SELATAN",
  "8205": "KAB. KEPULAUAN SULA",
  "8206": "KAB. HALMAHERA UTARA",
  "8207": "KAB. PULAU MOROTAI",
  "8208": "KAB. PULAU TALIABU",
  "8271": "KOTA TERNATE",
  "8272": "KOTA TIDORE KEPULAUAN",
  "9101": "KAB. MERAUKE",
  "9102": "KAB. JAYAWIJAYA",
  "9103": "KAB. JAYAPURA",
  "9104": "KAB. NABIRE",
  "9105": "KAB. KEPULAUAN YAPEN",
  "9106": "KAB. BIAK NUMFOR",
  "9107": "KAB. PUNCAK JAYA",
  "9108": "KAB. PANIAI",
  "9109": "KAB. MIMIKA",
  "9110": "KAB. SARMI",
  "9111": "KAB. KEEROM",
  "9112": "KAB. PEGUNUNGAN BINTANG",
  "9113": "KAB. YAHUKIMO",
  "9114": "KAB. TOLIKARA",
  "9115": "KAB. WAROPEN",
  "9116": "KAB. BOVEN DIGOEL",
  "9117": "KAB. MAPPI",
  "9118": "KAB. ASMAT",
  "9119": "KAB. SUPIORI",
  "9120": "KAB. MAMBERAMO RAYA",
  "9121": "KAB. MAMBERAMO TENGAH",
  "9122": "KAB. YALIMO",
  "9123": "KAB. LANNY JAYA",
  "9124": "KAB. NDUGA",
  "9125": "KAB. PUNCAK",
  "9126": "KAB. DOGIYAI",
  "9127": "KAB. INTAN JAYA",
  "9128": "KAB. DEIYAI",
  "9171": "KOTA JAYAPURA",
  "9201": "KAB. SORONG SELATAN",
  "9202": "KAB. MANOKWARI",
  "9203": "KAB. FAKFAK",
  "9204": "KAB. SORONG",
  "9205": "KAB. RAJA AMPAT",
  "9206": "KAB. TELUK BINTUNI",
  "9207": "KAB. TELUK WONDAMA",
  "9208": "KAB. KAIMANA",
  "9209": "KAB. TAMBRAUW",
  "9210": "KAB. MAYBRAT",
  "9211": "KAB. MANOKWARI SELATAN",
  "9212": "KAB. PEGUNUNGAN ARFAK",
  "9271": "KOTA SORONG",
};

/**
 * Parse NIK Indonesia menjadi komponen-komponennya.
 */
export function parseNIK(nik: string): ParsedNIK {
  const cleanNik = nik.replace(/\D/g, "");
  const errors: string[] = [];

  if (cleanNik.length !== 16) {
    errors.push("NIK harus 16 digit");
    return { isValid: false, errors };
  }

  const provinsiCode = cleanNik.substring(0, 2);
  const kabupatenCode = cleanNik.substring(0, 4);
  const kecamatanCode = cleanNik.substring(0, 6);
  const tanggalRaw = parseInt(cleanNik.substring(6, 8), 10);
  const bulan = parseInt(cleanNik.substring(8, 10), 10);
  const tahun2digit = parseInt(cleanNik.substring(10, 12), 10);
  const nomorUrut = cleanNik.substring(12, 16);

  const provinsiName = PROVINSI_MAP[provinsiCode];
  if (!provinsiName) {
    errors.push(`Kode provinsi "${provinsiCode}" tidak dikenal`);
  }

  const kabupatenName = KABUPATEN_MAP[kabupatenCode];
  if (!kabupatenName) {
    errors.push(`Kode kabupaten/kota "${kabupatenCode}" tidak dikenal`);
  }

  let jenisKelamin: "LAKI-LAKI" | "PEREMPUAN";
  let tanggalLahir: number;

  if (tanggalRaw > 40) {
    jenisKelamin = "PEREMPUAN";
    tanggalLahir = tanggalRaw - 40;
    if (tanggalLahir < 1 || tanggalLahir > 31) {
      errors.push(`Tanggal lahir tidak valid: ${tanggalLahir} (dari ${tanggalRaw})`);
    }
  } else {
    jenisKelamin = "LAKI-LAKI";
    tanggalLahir = tanggalRaw;
    if (tanggalLahir < 1 || tanggalLahir > 31) {
      errors.push(`Tanggal lahir tidak valid: ${tanggalLahir}`);
    }
  }

  if (bulan < 1 || bulan > 12) {
    errors.push(`Bulan lahir tidak valid: ${bulan}`);
  }

  const currentYear = new Date().getFullYear();
  const current2Digit = currentYear % 100;
  let tahunLahir: number;

  if (tahun2digit <= current2Digit) {
    tahunLahir = 2000 + tahun2digit;
  } else {
    tahunLahir = 1900 + tahun2digit;
  }

  if (tahunLahir > currentYear) {
    errors.push(`Tahun lahir ${tahunLahir} di masa depan`);
  }

  let tanggalLahirISO: string | undefined;
  if (
    bulan >= 1 &&
    bulan <= 12 &&
    tanggalLahir >= 1 &&
    tanggalLahir <= 31 &&
    tahunLahir <= currentYear
  ) {
    const date = new Date(tahunLahir, bulan - 1, tanggalLahir);
    if (
      date.getFullYear() === tahunLahir &&
      date.getMonth() === bulan - 1 &&
      date.getDate() === tanggalLahir
    ) {
      tanggalLahirISO = `${tahunLahir}-${String(bulan).padStart(2, "0")}-${String(tanggalLahir).padStart(2, "0")}`;
    } else {
      errors.push(`Tanggal ${tanggalLahir}/${bulan}/${tahunLahir} tidak valid`);
    }
  }

  const kecamatanName = getKecamatanName(kecamatanCode);

  return {
    isValid: errors.length === 0,
    errors,
    provinsiCode,
    provinsiName,
    kabupatenCode,
    kabupatenName,
    kecamatanCode,
    kecamatanName,
    tanggalLahir,
    bulanLahir: bulan,
    tahunLahir,
    jenisKelamin,
    tanggalLahirISO,
    nomorUrut,
  };
}

export function getTanggalLahirFromNIK(nik: string): string | null {
  const parsed = parseNIK(nik);
  return parsed.tanggalLahirISO ?? null;
}

export function getJenisKelaminFromNIK(
  nik: string,
): "LAKI-LAKI" | "PEREMPUAN" | null {
  const parsed = parseNIK(nik);
  return parsed.jenisKelamin ?? null;
}
