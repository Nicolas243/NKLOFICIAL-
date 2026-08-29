// =======================================================================
// BANCO DE LINKS EXTERNOS / PARCEIROS / LUTHERIAS
// Permite mapear caminhos específicos para sites independentes
// =======================================================================

const linksVerMais = {
    // FAMÍLIA: ALICE
    "Alice A703": "", "Alice A708": "", "Alice A747": "",

    // FAMÍLIA: CORELLI
    "Corelli Alliance": "", "Corelli Cantiga": "", "Corelli Crystal": "",

    // FAMÍLIA: D'ADDARIO
    "D'Addario Ascenté": "", "D'Addario Helicore": "", "D'Addario Kaplan Amo": "", 
    "D'Addario Kaplan Vivo": "", "D'Addario Prelude": "", "D'Addario Pro-Arte": "", 
    "D'Addario Zyex": "",

    // FAMÍLIA: DOGAL
    "Dogal Capriccio": "", "Dogal Green Label": "",

    // FAMÍLIA: JARGAR
    "Jargar Classic": "", "Jargar Evoke": "", "Jargar Superior": "", "Jargar Young Talent": "",

    // FAMÍLIA: LARSEN
    "Larsen Aurora": "", "Larsen Il Cannone": "", "Larsen Il Cannone Dir. Foc.": "", 
    "Larsen Il Cannone Gold": "", "Larsen Il Cannone Silver": "", "Larsen Il Cannone Solist": "", 
    "Larsen Original": "", "Larsen Tzigane": "", "Larsen Virtuoso": "",

    // FAMÍLIA: PIRASTRO
    "Pirastro Aricore": "", "Pirastro Chorda": "", "Pirastro Chromcor": "", "Pirastro Eudoxa": "", 
    "Pirastro Evah Pirazzi": "", "Pirastro Evah Pirazzi Gold": "", "Pirastro Flexocor Permanent": "", 
    "Pirastro Gold Label": "", "Pirastro Obligato": "", "Pirastro Oliv": "", "Pirastro Passione": "", 
    "Pirastro Passione Solo": "", "Pirastro Perpetual": "", "Pirastro Piranito": "", "Pirastro Synoxa": "", 
    "Pirastro Tonica": "", "Pirastro Violino": "", "Pirastro Wondertone Solo": "",

    // FAMÍLIA: THOMASTIK
    "Thomastik Alphayue": "", "Thomastik Dominant": "", "Thomastik Dominant Pro": "", 
    "Thomastik Dynamo": "", "Thomastik Dynamo Solo": "", "Thomastik Infeld Blue": "", 
    "Thomastik Infeld Red": "", "Thomastik Peter Infeld (PI)": "", "Thomastik Prazision": "", 
    "Thomastik Rondo": "", "Thomastik Rondo Gold": "", "Thomastik Spirit": "", 
    "Thomastik Spirocore": "", "Thomastik Superflexible": "", "Thomastik Ti": "", 
    "Thomastik Vision": "", "Thomastik Vision Solo": "", "Thomastik Vision Tit. Orq.": "", 
    "Thomastik Vision Tit. Solo": "",

    // FAMÍLIA: WARCHAL
    "Warchal Amber": "", "Warchal Ametyst": "", "Warchal Brilliant": "", 
    "Warchal Brilliant Vintage": "", "Warchal Karneol": "", "Warchal Russian A": "", 
    "Warchal Timbre": "",

    // OUTRAS MARCAS E NACIONAIS
    "Di Pietro Studio Uno": "", "Dominante Orchestral": "", "Erudithus #01": "", 
    "EuroString": "", "For-Tune Charm": "", "Giannini GEAV": "", "Lenzner Goldbrokat (Só E)": "", 
    "Mauro Calixto Padrão": "", "NIG NVE804": "", "Opal Titan": "", "Orquezz PRO": "", 
    "Paganini PE950 (Aço)": "", "Paganini PE980 (Perlon)": "", "Prim Heavy": "", 
    "Prim Medium": "", "Smart": "", "Strinberg VS4": "", "Super-Sensitive Red Label": "", 
    "Super-Sensitive Sensicore": ""
};

/**
 * Retorna a rota externa específica da lutheria parceira.
 * Se estiver em branco, aponta para uma página padrão do portal onde você pode listar parcerias.
 */
function obterLinkVerMais(nomeCorda) {
    if (linksVerMais[nomeCorda] && linksVerMais[nomeCorda] !== "") {
        return linksVerMais[nomeCorda];
    }
    
    // Fallback de contingência para não quebrar a navegação
    return "lojas-parceiras.html"; 
}