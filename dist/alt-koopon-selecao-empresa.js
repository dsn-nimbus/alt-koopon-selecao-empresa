;(function(ng) {
  "use strict";

  ng.module('alt.koopon.selecao-empresa', [
    'ngResource',
    'alt.passaporte-usuario-logado',
    'alt.alerta-flutuante',
    'alt.carregando-info'
  ])
  .config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push('AltKooponEmpresaNaoSelecionadaInterceptor');
  }])
  .factory('AltKooponEmpresaNaoSelecionadaInterceptor', ['$q', '$location', function ($q, $location) {
    return {
      responseError: function(rej) {
        var _deveSelecionarEmpresa = (!!rej) && (rej.status === 403) && (!!rej.data) && (rej.data.deveSelecionarEmpresa);

        if (_deveSelecionarEmpresa) {
          $location.path('/selecao-empresas');
        }

        return $q.reject(rej);
      }
    };
  }])
  .provider('AltKoopon_BASE_API', function() {
    this.url = '/koopon-rest-api/';

    this.$get = function() {
      return this.url;
    }
  })
  .factory('AltKooponEmpresaResource', ['$resource', 'AltKoopon_BASE_API', function($resource, AltKoopon_BASE_API) {
    var _url = AltKoopon_BASE_API + 'assinantes/selecao';
    var _params = {};
    var _methods = {
      escolhe: {
        method: "POST",
        isArray: false
      }
    };

    return $resource(_url, _params, _methods);
  }])
  .factory('AltKooponEmpresaService', ['$q', '$xtorage', 'AltPassaporteUsuarioLogadoManager', 'AltKooponEmpresaResource', function($q, $xtorage, AltPassaporteUsuarioLogadoManager, AltKooponEmpresaResource) {
    var CHAVE_STORAGE_EMPRESA_ESCOLHIDA = 'emp_escolhida';

    var AltKooponEmpresaService = function() {

    };

    AltKooponEmpresaService.prototype.getEmpresas = function(nomeProp) {
      var _nomeProp = nomeProp || 'assinantes';

      return AltPassaporteUsuarioLogadoManager.retorna()[_nomeProp];
    };

    AltKooponEmpresaService.prototype.salvaNaStorageEmpresaEscolhida = function(empresa, chave) {
      var _chave = chave || CHAVE_STORAGE_EMPRESA_ESCOLHIDA;

      $xtorage.save(_chave, empresa);
    };

    AltKooponEmpresaService.prototype.getEmpresaEscolhidaDaStorage = function(chave) {
      var _chave = chave || CHAVE_STORAGE_EMPRESA_ESCOLHIDA;

      return $xtorage.get(_chave);
    };

    AltKooponEmpresaService.prototype.escolhe = function(empresa) {
      if (angular.isUndefined(empresa) || !angular.isObject(empresa) || angular.isUndefined(empresa.id)) {
        return $q.reject(new TypeError('Empresa deve ser informada para ser passada ao servidor.'));
      }

      return AltKooponEmpresaResource
      .escolhe({empresaEscolhida: empresa.id})
      .$promise
      .then(function(empresaEscolhida) {
        return empresaEscolhida;
      })
      .catch(function(erro) {
        return $q.reject(erro);
      });
    };

    return new AltKooponEmpresaService();
  }])
  .controller('AltKooponSelecaoEmpresasController', ['$location', 'AltKooponEmpresaService', 'AltAlertaFlutuanteService', 'AltCarregandoInfoService',
  function($location, AltKooponEmpresaService, AltAlertaFlutuanteService, AltCarregandoInfoService) {
    var self = this;

    self.empresas = [];

    self._escolheEmpresa = function(empresa) {
      AltCarregandoInfoService.exibe();

      AltKooponEmpresaService
      .escolhe(empresa)
      .then(function() {
        $location.path('/');
        AltKooponEmpresaService.salvaNaStorageEmpresaEscolhida(empresa);
      })
      .catch(function(erro) {
        AltAlertaFlutuanteService.exibe({msg: erro.mensagem});
      })
      .finally(function() {
        AltCarregandoInfoService.esconde();
      });
    };

    self.escolheEmpresa = function(empresa) {
      self._escolheEmpresa(empresa);
    };

    self.init = function(emp) {
      self.empresas = AltKooponEmpresaService.getEmpresas(emp) || self.empresas;

      if (self.empresas.length === 1) {
        self._escolheEmpresa(self.empresas[0]);
      }
    };
  }]);
}(window.angular));
