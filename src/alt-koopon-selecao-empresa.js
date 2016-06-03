;(function(ng) {
  "use strict";

  ng.module('alt.koopon.selecao-empresa', [
      'ngResource',
      'alt.passaporte-usuario-logado',
      'alt.alerta-flutuante',
      'alt.passaporte-procuracao',
      'alt.alerta-flutuante',
      'alt.carregando-info'
    ])
    .config(['$httpProvider', function($httpProvider) {
      $httpProvider.interceptors.push('AltKooponEmpresaNaoSelecionadaInterceptor');
    }])
    .constant('ID_KOOPON_EMPRESA', '60f1fe1f835b14a3d20ac0f046fac668')
    .constant('ID_KOOPON_CONTADOR', '3c59dc048e8850243be8079a5c74d079')
    .constant('AltKooponEventoEmpresa', {
      EVENTO_EMPRESA_ESCOLHIDA: 'alt.koopon.empresa-escolhida',
      EVENTO_EMPRESA_NAO_CONFIGURADA: 'alt.koopon.empresa-nao-configurada'
    })
    .factory('AltKooponEmpresaNaoSelecionadaInterceptor', ['$rootScope', '$q', '$location', 'AltKooponEventoEmpresa', function ($rootScope, $q, $location, AltKooponEventoEmpresa) {
      return {
        responseError: function(rej) {
          var _deveSelecionarEmpresa = (!!rej) && (rej.status === 403) && (!!rej.data) && (rej.data.deveSelecionarEmpresa);
          var _wizardUrl = !!~$location.path().indexOf('wizard');

          if (_deveSelecionarEmpresa && !_wizardUrl) {
            $rootScope.$broadcast(AltKooponEventoEmpresa.EVENTO_EMPRESA_NAO_CONFIGURADA);
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
    .factory('AltKooponEmpresaService', ['$rootScope','$q', '$xtorage', 'AltPassaporteUsuarioLogadoManager', 'AltKooponEmpresaResource', 'AltKooponEventoEmpresa',
      function($rootScope, $q, $xtorage, AltPassaporteUsuarioLogadoManager, AltKooponEmpresaResource, AltKooponEventoEmpresa) {

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
              $rootScope.$broadcast(AltKooponEventoEmpresa.EVENTO_EMPRESA_ESCOLHIDA, empresa);
              return empresaEscolhida;
            })
            .catch(function(erro) {
              return $q.reject(erro);
            });
        };

        return new AltKooponEmpresaService();
      }])
    .service('AltKooponSelecaoEmpresasHelper', ['$location', 'AltKooponEmpresaService', function($location, AltKooponEmpresaService) {
      this.escolheEmpresaSemProcuracao = function(empresa) {
        return AltKooponEmpresaService
          .escolhe(empresa)
          .then(function() {
            AltKooponEmpresaService.salvaNaStorageEmpresaEscolhida(empresa);
            $location.path('/');
          });
      };
    }])
    .controller('AltKooponSelecaoEmpresasController', ['AltKooponSelecaoEmpresasHelper', 'AltKooponEmpresaService', 'AltAlertaFlutuanteService', 'AltCarregandoInfoService',
      function(AltKooponSelecaoEmpresasHelper, AltKooponEmpresaService, AltAlertaFlutuanteService, AltCarregandoInfoService) {
        var self = this;

        self.empresas = [];

        self.escolheEmpresa = function(empresa) {
          AltCarregandoInfoService.exibe();

          AltKooponSelecaoEmpresasHelper
            .escolheEmpresaSemProcuracao(empresa)
            .catch(function(erro) {
              AltAlertaFlutuanteService.exibe({msg: erro.mensagem});
            })
            .finally(function() {
              AltCarregandoInfoService.esconde();
            });
        };

        self.init = function(emp) {
          self.empresas = AltKooponEmpresaService.getEmpresas(emp) || self.empresas;

          if (self.empresas.length === 1) {
            self.escolheEmpresa(self.empresas[0]);
          }
        };
      }]);
}(window.angular));
