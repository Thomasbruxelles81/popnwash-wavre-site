/* POP'n WASH — V5 enhancements only. Original app, reviews, translations, theme and live contact form stay in place. */
(()=>{
'use strict';
const html=document.documentElement;
const byId=id=>document.getElementById(id);
const keys=['navHow','navLoyalty','navPrices','navPro','quickPrices','rfDispenser','rfProducts','rfFrom','rfSoftener','rfGuide','rfTerminal','rfTerminalShort',
'rfTerminal1','rfTerminal2','rfTerminal3','rfTerminal4','rfTerminalTip','rfFidelity','rfFidelityShort','rfFidelity1','rfFidelity2','rfFidelity3','rfFidelity4',
'rfFidelityTip','rfLoyaltyKicker','rfLoyaltyHeading','rfLoyaltyDescription','rfGetCard','rfRecharge','rfLoyaltyNote','rfProInvoices','rfProMachines','rfProLoyalty'];
const words={
fr:["Mode d'emploi","Fidélité","Tarifs","Espace Pro","Voir tous les prix","Distributeur","Lessive & produits","Dès 1 €","Assouplissant : 0,50 €","Mode d'emploi ↗","Centrale de paiement","Choisissez · vérifiez · payez",
"Choisissez le service : machine, séchoir, calandre ou produits.","Vérifiez le numéro et la durée.","Payez par pièces, billets, carte ou smartphone.","Suivez les consignes affichées pour démarrer.","Facture : notez les 4 caractères affichés brièvement après paiement.",
"Carte fidélité","Première carte · crédit · lessive offerte","À la centrale, ouvrez la rubrique Produits.","Sélectionnez le code 77 à la centrale pour obtenir la carte.","Payez 40 € : recevez 40 € de crédit et la carte offerte.","Un premier sachet de lessive est également offert.","Les recharges suivantes bénéficient de bonus.",
"VOTRE FIDÉLITÉ RAPPORTE","Une carte, des bonus, du crédit supplémentaire.","Première carte offerte pour 40 € de crédit achetés, avec un sachet de lessive offert. Puis profitez d'un crédit bonus lors des recharges suivantes.","Comment obtenir ma carte ? ↗","Simulez votre prochaine recharge","La première offre de 40 € et les recharges bonifiées sont distinctes. Carte seule / duplicata : 10 €.","▤ Récupérer une facture ↗","◉ Machines en direct ↗","✦ Fidélité et recharges ↗"],
nl:["Gebruiksaanwijzing","Klantenkaart","Prijzen","Voor professionals","Alle prijzen bekijken","Automaat","Wasmiddel & producten","Vanaf € 1","Wasverzachter: € 0,50","Gebruiksaanwijzing ↗","Betaalautomaat","Kies · controleer · betaal",
"Kies wasmachine, droger, mangel of producten.","Controleer het nummer en de duur.","Betaal met munten, biljetten, kaart of smartphone.","Volg de startinstructies.","Factuur: noteer de 4 tekens die kort na betaling verschijnen.",
"Klantenkaart","Eerste kaart · tegoed · wasmiddel gratis","Open Producten op de automaat.","Selecteer code 77 volgens de aanwijzingen ter plaatse.","Betaal € 40 voor € 40 tegoed; de kaart is gratis.","Ook het eerste zakje wasmiddel is gratis.","Bij latere herladingen ontvangt u extra tegoed.",
"TROUW WORDT BELOOND","Een kaart, bonussen en extra tegoed.","Uw eerste kaart is gratis bij aankoop van € 40 tegoed, met gratis wasmiddel. Latere herladingen geven extra tegoed.","Hoe krijg ik de kaart? ↗","Bereken uw herlading","Eerste aankoop en bonusherladingen zijn aparte aanbiedingen. Losse of vervangende kaart: € 10.","▤ Factuur ophalen ↗","◉ Machines live ↗","✦ Kaart en herladingen ↗"],
en:["How it works","Loyalty","Prices","Business","See all prices","Dispenser","Detergent & products","From €1","Softener: €0.50","How to use ↗","Payment terminal","Select · check · pay",
"Choose washer, dryer, ironer or products.","Check the number and duration.","Pay with coins, notes, card or smartphone.","Follow the start instructions.","Invoice: note the 4 characters briefly shown after payment.",
"Loyalty card","First card · credit · free detergent","Open Products on the terminal.","Choose code 77 according to the on-site instructions.","Pay €40 for €40 credit; your first card is free.","Your first detergent sachet is free as well.","Later top-ups earn bonus credit.",
"LOYALTY PAYS","One card, bonuses and extra credit.","Your first card is free with €40 credit purchased, plus a detergent sachet. Future top-ups earn bonus credit.","How do I get my card? ↗","Try a top-up amount","The first €40 offer differs from bonus top-ups. Card alone or replacement: €10.","▤ Get an invoice ↗","◉ Live machines ↗","✦ Loyalty and top-ups ↗"],
de:["So funktioniert's","Treuekarte","Preise","Für Unternehmen","Alle Preise","Automat","Waschmittel & Produkte","Ab 1 €","Weichspüler: 0,50 €","Anleitung ↗","Zahlungsautomat","Wählen · prüfen · zahlen",
"Wählen Sie Waschmaschine, Trockner, Mangel oder Produkte.","Prüfen Sie Nummer und Dauer.","Zahlen Sie mit Münzen, Scheinen, Karte oder Smartphone.","Befolgen Sie die Startanweisungen.","Rechnung: vier Zeichen kurz nach der Zahlung notieren.",
"Treuekarte","Erste Karte · Guthaben · Waschmittel gratis","Wählen Sie Produkte am Automaten.","Wählen Sie Code 77 gemäß den Hinweisen vor Ort.","Zahlen Sie 40 € für 40 € Guthaben; Karte gratis.","Ein Waschmittelbeutel ist ebenfalls gratis.","Weitere Aufladungen bringen Bonusguthaben.",
"TREUE ZAHLT SICH AUS","Eine Karte, Boni und mehr Guthaben.","Erste Karte bei Kauf von 40 € Guthaben gratis, inklusive Waschmittel. Weitere Aufladungen bringen Bonusguthaben.","Wie bekomme ich meine Karte? ↗","Aufladung ausprobieren","Das erste Angebot unterscheidet sich von Bonusaufladungen. Einzel- oder Ersatzkarte: 10 €.","▤ Rechnung abrufen ↗","◉ Maschinen live ↗","✦ Treuekarte und Guthaben ↗"],
it:["Come funziona","Fedeltà","Prezzi","Area Pro","Vedi tutti i prezzi","Distributore","Detersivi e prodotti","Da 1 €","Ammorbidente: 0,50 €","Istruzioni ↗","Terminale di pagamento","Scegli · controlla · paga",
"Scegli lavatrice, asciugatrice, calandra o prodotti.","Controlla numero e durata.","Paga con monete, banconote, carta o smartphone.","Segui le istruzioni per avviare.","Fattura: annota i 4 caratteri mostrati dopo il pagamento.",
"Carta fedeltà","Prima carta · credito · detersivo gratis","Apri Prodotti sul terminale.","Seleziona il codice 77 secondo le istruzioni sul posto.","Paga 40 € per 40 € di credito; la carta è gratis.","Anche la prima bustina di detersivo è gratis.","Le ricariche successive offrono bonus.",
"LA FEDELTÀ PREMIA","Una carta, bonus e credito extra.","Prima carta gratuita con 40 € di credito acquistato e detersivo in omaggio. Le ricariche successive danno bonus.","Come ottenere la carta? ↗","Simula una ricarica","La prima offerta è distinta dalle ricariche bonus. Carta singola o duplicato: 10 €.","▤ Recupera una fattura ↗","◉ Macchine in diretta ↗","✦ Fedeltà e ricariche ↗"],
es:["Cómo funciona","Fidelidad","Precios","Espacio Pro","Todos los precios","Dispensador","Detergente y productos","Desde 1 €","Suavizante: 0,50 €","Instrucciones ↗","Terminal de pago","Elige · comprueba · paga",
"Elige lavadora, secadora, calandra o productos.","Comprueba número y duración.","Paga con monedas, billetes, tarjeta o móvil.","Sigue las instrucciones de inicio.","Factura: anota los 4 caracteres mostrados tras pagar.",
"Tarjeta de fidelidad","Primera tarjeta · saldo · detergente gratis","Abre Productos en el terminal.","Selecciona el código 77 según las indicaciones del local.","Paga 40 € por 40 € de saldo; tarjeta gratis.","También recibirás una bolsita de detergente gratis.","Las siguientes recargas incluyen bonificaciones.",
"TU FIDELIDAD CUENTA","Una tarjeta, bonos y más saldo.","Primera tarjeta gratis al comprar 40 € de saldo, con detergente de regalo. Las recargas posteriores tienen bonus.","¿Cómo obtener la tarjeta? ↗","Simula una recarga","La primera oferta es distinta de las recargas con bonus. Tarjeta suelta o duplicado: 10 €.","▤ Obtener factura ↗","◉ Máquinas en directo ↗","✦ Fidelidad y recargas ↗"],
pt:["Como funciona","Fidelidade","Preços","Espaço Pro","Ver todos os preços","Distribuidor","Detergente e produtos","Desde 1 €","Amaciador: 0,50 €","Instruções ↗","Terminal de pagamento","Escolha · confirme · pague",
"Escolha máquina, secador, calandra ou produtos.","Confirme número e duração.","Pague com moedas, notas, cartão ou smartphone.","Siga as instruções de início.","Fatura: anote os 4 caracteres mostrados após o pagamento.",
"Cartão fidelidade","Primeiro cartão · crédito · detergente grátis","Abra Produtos no terminal.","Selecione o código 77 conforme as indicações no local.","Pague 40 € por 40 € de crédito; cartão grátis.","Receba também uma saqueta de detergente grátis.","As recargas seguintes dão crédito bónus.",
"A FIDELIDADE COMPENSA","Um cartão, bónus e crédito extra.","Primeiro cartão grátis na compra de 40 € de crédito, com detergente oferecido. As recargas seguintes dão bónus.","Como obter o cartão? ↗","Simular recarga","A primeira oferta é distinta das recargas com bónus. Cartão avulso ou duplicado: 10 €.","▤ Obter fatura ↗","◉ Máquinas em direto ↗","✦ Fidelidade e recargas ↗"],
ro:["Mod de utilizare","Fidelitate","Tarife","Spațiu Pro","Toate tarifele","Distribuitor","Detergent și produse","De la 1 €","Balsam: 0,50 €","Instrucțiuni ↗","Terminal de plată","Alegeți · verificați · plătiți",
"Alegeți mașina, uscătorul, calandrul sau produsele.","Verificați numărul și durata.","Plătiți cu monede, bancnote, card sau telefon.","Urmați pașii de pornire.","Factură: notați cele 4 caractere afișate după plată.",
"Card de fidelitate","Primul card · credit · detergent cadou","Deschideți Produse la terminal.","Selectați codul 77 conform indicațiilor de la fața locului.","Plătiți 40 € pentru 40 € credit; card gratuit.","Primiți și detergent gratuit.","Reîncărcările ulterioare oferă bonus.",
"FIDELITATEA ESTE RĂSPLĂTITĂ","Un card, bonusuri și credit în plus.","Primul card gratuit la 40 € credit cumpărat, plus detergent cadou. Reîncărcările ulterioare oferă bonus.","Cum obțin cardul? ↗","Simulați o reîncărcare","Oferta inițială diferă de reîncărcările cu bonus. Card separat sau duplicat: 10 €.","▤ Obțineți factura ↗","◉ Mașini în timp real ↗","✦ Fidelitate și reîncărcări ↗"],
pl:["Jak to działa","Karta lojalnościowa","Ceny","Dla firm","Wszystkie ceny","Automat","Detergent i produkty","Od 1 €","Płyn do płukania: 0,50 €","Instrukcja ↗","Terminal płatniczy","Wybierz · sprawdź · zapłać",
"Wybierz pralkę, suszarkę, magiel lub produkty.","Sprawdź numer i czas.","Zapłać monetami, banknotami, kartą lub telefonem.","Postępuj zgodnie z instrukcją uruchomienia.","Faktura: zapisz 4 znaki wyświetlane po płatności.",
"Karta lojalnościowa","Pierwsza karta · kredyt · detergent gratis","Wybierz Produkty na terminalu.","Wybierz kod 77 zgodnie z instrukcją na miejscu.","Wpłać 40 € za 40 € kredytu; karta gratis.","Dostaniesz też saszetkę detergentu gratis.","Kolejne doładowania dają bonus.",
"LOJALNOŚĆ SIĘ OPŁACA","Jedna karta, bonusy i więcej kredytu.","Pierwsza karta gratis przy zakupie 40 € kredytu, z detergentem. Kolejne doładowania dają bonus.","Jak otrzymać kartę? ↗","Sprawdź doładowanie","Pierwsza oferta różni się od bonusowych doładowań. Karta osobno lub duplikat: 10 €.","▤ Pobierz fakturę ↗","◉ Pralki na żywo ↗","✦ Karta i doładowania ↗"],
uk:["Як користуватися","Лояльність","Ціни","Для бізнесу","Усі ціни","Автомат","Засоби для прання","Від 1 €","Кондиціонер: 0,50 €","Інструкція ↗","Платіжний термінал","Оберіть · перевірте · оплатіть",
"Оберіть машину, сушарку, каландр або засоби.","Перевірте номер і час.","Оплатіть монетами, купюрами, карткою або телефоном.","Дотримуйтеся інструкцій запуску.","Рахунок: запишіть 4 символи після оплати.",
"Картка лояльності","Перша картка · кредит · засіб у подарунок","Оберіть Продукти на терміналі.","Виберіть код 77 згідно з вказівками на місці.","Сплатіть 40 € за 40 € кредиту; картка безкоштовна.","Перший засіб також у подарунок.","Наступні поповнення дають бонус.",
"ЛОЯЛЬНІСТЬ ВИНАГОРОДЖУЄТЬСЯ","Одна картка, бонуси та більше кредиту.","Перша картка безкоштовна при купівлі кредиту 40 € з пакетом засобу. Подальші поповнення додають бонус.","Як отримати картку? ↗","Розрахуйте поповнення","Перша пропозиція відрізняється від бонусних поповнень. Окрема картка або дублікат: 10 €.","▤ Отримати рахунок ↗","◉ Машини онлайн ↗","✦ Картка та поповнення ↗"],
ru:["Как пользоваться","Лояльность","Цены","Для бизнеса","Все цены","Автомат","Моющие средства","От 1 €","Кондиционер: 0,50 €","Инструкция ↗","Платёжный терминал","Выберите · проверьте · оплатите",
"Выберите стирку, сушку, каландр или товары.","Проверьте номер и время.","Оплатите монетами, купюрами, картой или телефоном.","Следуйте инструкции запуска.","Счёт: запишите 4 символа после оплаты.",
"Карта лояльности","Первая карта · кредит · средство бесплатно","Откройте Товары на терминале.","Выберите код 77 по указаниям на месте.","Оплатите 40 € за кредит 40 €; карта бесплатно.","Первый пакетик средства также бесплатно.","Последующие пополнения дают бонус.",
"ЛОЯЛЬНОСТЬ ВЫГОДНА","Одна карта, бонусы и больше кредита.","Первая карта бесплатно при покупке кредита на 40 € с пакетиком средства. Следующие пополнения дают бонус.","Как получить карту? ↗","Рассчитать пополнение","Первое предложение отличается от бонусных пополнений. Отдельная карта или дубликат: 10 €.","▤ Получить счёт ↗","◉ Машины онлайн ↗","✦ Лояльность и пополнения ↗"]
};
for(const [lang,v] of Object.entries(words)){if(v.length!==keys.length)throw new Error("Bad locale "+lang+": "+v.length+"/"+keys.length)}
const dict=Object.fromEntries(Object.entries(words).map(([lang,values])=>[lang,Object.fromEntries(keys.map((key,i)=>[key,values[i]]))]));
const credits={"10":"10,50","20":"21,50","30":"32,50","40":"43,50","50":"55","100":"112"};
let chosen="40";
function render(){
 const lang=(html.lang||"fr").split("-")[0],t=dict[lang]||dict.fr;
 document.querySelectorAll("[data-rf]").forEach(el=>{if(t[el.dataset.rf])el.textContent=t[el.dataset.rf]});
 document.querySelectorAll('[data-i18n="navPros"]').forEach(el=>{el.textContent=t.navPro});
 const out=byId("refonteBonusResult");
 if(out)out.textContent=chosen+" € → "+credits[chosen]+" € "+({nl:"tegoed",en:"credit",de:"Guthaben",it:"di credito",es:"de saldo",pt:"de crédito",ro:"credit",pl:"kredytu",uk:"кредиту",ru:"кредита"}[lang]||"de crédit");
}
const original=document.querySelector(".services-secondary-grid .loyalty-card"),mount=byId("refonteLoyaltyMount");
if(mount&&original)mount.appendChild(original); // Existing click handlers and modal are preserved.
/* Make the loyalty offer the very next section after prices, without replacing
   any existing service blocks or disrupting their original event handlers. */
const tariffs=document.querySelector(".tariff-grid"),loyalty=byId("fidelite");
if(tariffs&&loyalty)tariffs.insertAdjacentElement("afterend",loyalty);
function guide(key){
 const selected=document.querySelector('[data-guide-panel="'+key+'"]');if(!selected)return;
 document.querySelectorAll("[data-guide-panel]").forEach(el=>{if(el!==selected)el.open=false});
 selected.open=true;
 const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
 requestAnimationFrame(()=>selected.scrollIntoView({behavior:reduce?"auto":"smooth",block:"center"}));
}
document.querySelectorAll(".tariff-grid [data-guide]").forEach(el=>el.addEventListener("click",e=>{e.preventDefault();guide(el.dataset.guide)}));
document.querySelectorAll("[data-guide-open]").forEach(el=>el.addEventListener("click",()=>guide(el.dataset.guideOpen)));
document.querySelectorAll(".rf-bonus-choices button").forEach(el=>el.addEventListener("click",()=>{
 if(!(el.dataset.bonus in credits))return;chosen=el.dataset.bonus;
 document.querySelectorAll(".rf-bonus-choices button").forEach(b=>b.classList.toggle("is-active",b===el));render();
}));
/* Preserve meaningful hover feedback even when browser emulation lacks CSS
   hover capability. Focus-visible is provided in CSS for keyboard users. */
document.querySelectorAll('a.social-link.facebook').forEach(link=>{
  link.addEventListener('pointerenter',()=>link.classList.add('rf-hover-active'));
  link.addEventListener('mouseenter',()=>link.classList.add('rf-hover-active'));
  link.addEventListener('pointerleave',()=>link.classList.remove('rf-hover-active'));
  link.addEventListener('mouseleave',()=>link.classList.remove('rf-hover-active'));
});
/* Prevent isolated French punctuation on a new line. A narrow no-break space
   links ? ! : ; to the preceding word while preserving screen-reader text. */
function preventFrenchOrphans(){
 if((html.lang||"fr").split("-")[0]!=="fr")return;
 for(const region of document.querySelectorAll(".refonte-utility,.site-header,.mobile-menu,main,footer")){
  const walker=document.createTreeWalker(region,NodeFilter.SHOW_TEXT);
  for(let node=walker.nextNode();node;node=walker.nextNode()){
   if(/[ \\t]+[?!;:]/.test(node.nodeValue||"")){
     node.nodeValue=node.nodeValue.replace(/[ \\t]+([?!;:])/g,"\u202f$1");
   }
  }
 }
}

/* V5C intelligent tariff column fitting:
   measure the actual content area, user font enlargement and language.
   Never keep an almost-empty final row when another balanced layout fits. */
let tariffFrame=0;
function fitTariffColumns(){
 if(!tariffs)return;
 const width=tariffs.getBoundingClientRect().width;
 const cards=[...tariffs.querySelectorAll(':scope > .tariff-card')];
 if(width<=0||!cards.length)return;
 const style=getComputedStyle(tariffs);
 const gap=parseFloat(style.columnGap)||12;
 const zoom=Number(html.dataset.displayScale||110)/100;
 /* Tiny phones keep two compact cards if legible. Larger screens increase
    density continuously, and high AAA text receives more width per card. */
 const minWidth= Math.max(128,130*zoom+(width>600?15:0));
 const fits= Math.max(1,Math.min(cards.length,Math.floor((width+gap)/(minWidth+gap))));
 let columns=fits;
 if(cards.length>columns&&columns>1&&cards.length%columns===1)columns--;
 const previous=Number(tariffs.style.getPropertyValue('--rf-tariff-columns'));
 if(previous!==columns)tariffs.style.setProperty('--rf-tariff-columns',String(columns));
 const compact=columns===1&&width<700;
 if(tariffs.dataset.compactRows!==String(compact))tariffs.dataset.compactRows=String(compact);
}
function scheduleTariffFit(){
 if(tariffFrame)return;
 tariffFrame=requestAnimationFrame(()=>{tariffFrame=0;fitTariffColumns()});
}
if(tariffs){
 if(typeof ResizeObserver!=='undefined'){
  new ResizeObserver(scheduleTariffFit).observe(tariffs);
 }else{
  window.addEventListener('resize',scheduleTariffFit,{passive:true});
 }
 new MutationObserver(scheduleTariffFit).observe(html,{attributes:true,attributeFilter:['lang','data-display-scale']});
 if(document.fonts?.ready)document.fonts.ready.then(scheduleTariffFit);
 scheduleTariffFit();
}

const applyLocale=()=>{render();preventFrenchOrphans();scheduleTariffFit()};
new MutationObserver(applyLocale).observe(html,{attributes:true,attributeFilter:["lang"]});
applyLocale();
})();
