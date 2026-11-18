/**
 * CodigoBarrasValidacao - Validação de padrões de código de barras.
 *
 * Suporta:
 *  - EAN-8 (8 dígitos numéricos, com dígito verificador)
 *  - EAN-13 (13 dígitos numéricos, com dígito verificador)
 *  - UPC-A (12 dígitos numéricos, com dígito verificador)
 *  - Code 128 (alfanumérico, comprimento variável)
 *  - ITF-14 (14 dígitos numéricos, com dígito verificador) - opcional
 *
 * Regras:
 *  - Todos os códigos são tratados como STRING (preserva zeros à esquerda).
 *  - Nunca converte para número inteiro.
 *  - Aceita códigos alfanuméricos (Code 128).
 *  - Não rejeita códigos válidos apenas pelo comprimento (se não houver
 *    padrão reconhecido, aceita como Code 128 genérico).
 */

class CodigoBarrasValidacao {
  /**
   * Valida um código de barras e retorna { valido, formato, motivo }.
   * @param {string} codigo Código de barras como string
   * @returns {Object}
   */
  static validar(codigo) {
    if (codigo == null) {
      return { valido: false, formato: null, motivo: 'Código não informado.' };
    }

    const codigoStr = String(codigo).trim();

    if (codigoStr === '') {
      return { valido: false, formato: null, motivo: 'Código vazio.' };
    }

    // Detectar se é puramente numérico
    const numerico = /^\d+$/.test(codigoStr);
    const tamanho = codigoStr.length;

    // EAN-8: 8 dígitos numéricos
    if (numerico && tamanho === 8) {
      if (this._validarDigitoVerificadorEAN(codigoStr)) {
        return { valido: true, formato: 'EAN-8', motivo: 'Código válido.' };
      }
      return { valido: false, formato: 'EAN-8', motivo: 'Dígito verificador inválido (EAN-8).' };
    }

    // EAN-13: 13 dígitos numéricos
    if (numerico && tamanho === 13) {
      if (this._validarDigitoVerificadorEAN(codigoStr)) {
        return { valido: true, formato: 'EAN-13', motivo: 'Código válido.' };
      }
      return { valido: false, formato: 'EAN-13', motivo: 'Dígito verificador inválido (EAN-13).' };
    }

    // UPC-A: 12 dígitos numéricos
    if (numerico && tamanho === 12) {
      if (this._validarDigitoVerificadorUPC(codigoStr)) {
        return { valido: true, formato: 'UPC-A', motivo: 'Código válido.' };
      }
      return { valido: false, formato: 'UPC-A', motivo: 'Dígito verificador inválido (UPC-A).' };
    }

    // ITF-14: 14 dígitos numéricos
    if (numerico && tamanho === 14) {
      if (this._validarDigitoVerificadorEAN(codigoStr)) {
        return { valido: true, formato: 'ITF-14', motivo: 'Código válido.' };
      }
      return { valido: false, formato: 'ITF-14', motivo: 'Dígito verificador inválido (ITF-14).' };
    }

    // Code 128: alfanumérico, comprimento variável (mínimo 1 caractere).
    // Se não se encaixou num padrão numérico com DV, trata-se como Code 128 genérico.
    // Aceita letras e números.
    if (/^[A-Za-z0-9]+$/.test(codigoStr)) {
      return { valido: true, formato: 'Code 128', motivo: 'Código válido (Code 128).' };
    }

    // Código com caracteres não suportados
    return {
      valido: false,
      formato: null,
      motivo: 'Código contém caracteres não suportados. Use apenas letras e números.',
    };
  }

  /* ========================================================================
     DÍGITO VERIFICADOR EAN (EAN-8, EAN-13, ITF-14)
     ======================================================================== */

  static _validarDigitoVerificadorEAN(codigo) {
    const digitos = codigo.split('').map(Number);
    const verificador = digitos.pop();
    // EAN: da esquerda para a direita, posições ímpares (1,3,5...) multiplicam por 1,
    // posições pares (2,4,6...) multiplicam por 3.
    let soma = 0;
    for (let i = 0; i < digitos.length; i++) {
      const multiplicador = (i + 1) % 2 === 1 ? 1 : 3;
      soma += digitos[i] * multiplicador;
    }
    const calculado = (10 - (soma % 10)) % 10;
    return calculado === verificador;
  }

  /* ========================================================================
     DÍGITO VERIFICADOR UPC-A
     ======================================================================== */

  static _validarDigitoVerificadorUPC(codigo) {
    const digitos = codigo.split('').map(Number);
    const verificador = digitos.pop();
    // UPC: da direita para a esquerda, começar multiplicando por 3 na posição
    // imediatamente à esquerda do DV, alternar 3 e 1.
    const invertidos = digitos.slice().reverse();
    let soma = 0;
    for (let i = 0; i < invertidos.length; i++) {
      const multiplicador = i % 2 === 0 ? 3 : 1;
      soma += invertidos[i] * multiplicador;
    }
    const calculado = (10 - (soma % 10)) % 10;
    return calculado === verificador;
  }

  /**
   * Retorna true se o código for aceitável (qualquer formato válido).
   * Alias para validar().valido.
   */
  static aceitar(codigo) {
    return this.validar(codigo).valido;
  }
}

// Exportar para uso global (ES modules não são usados no projeto; script comum)
window.CodigoBarrasValidacao = CodigoBarrasValidacao;
