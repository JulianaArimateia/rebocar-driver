import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

type Props = {
  route?: { params?: { type?: 'terms' | 'privacy' } };
};

const TERMS_CONTENT = `
TERMOS DE USO — REBOCAR DRIVER
Versão 1.0 — Vigência: a partir de 01/06/2025

1. IDENTIFICAÇÃO E ACEITE

O aplicativo ReboCar Driver é operado por ReboCar Tecnologia e Serviços Ltda., inscrita no CNPJ sob o nº XX.XXX.XXX/0001-XX ("ReboCar"). Ao criar uma conta como Motorista Parceiro, você declara ter lido e aceitado integralmente estes Termos, em conformidade com o art. 8º da Lei 12.965/2014 (Marco Civil da Internet).

2. NATUREZA DA RELAÇÃO JURÍDICA

2.1. A relação entre a ReboCar e o Motorista Parceiro é de NATUREZA COMERCIAL, caracterizando-se como parceria para uso de plataforma tecnológica.
2.2. Não há vínculo empregatício entre a ReboCar e o Motorista Parceiro, conforme Súmula 443 do TST e jurisprudência consolidada sobre economia de plataformas.
2.3. O Motorista Parceiro é profissional autônomo que utiliza a plataforma para oferecer seus serviços.

3. REQUISITOS DO MOTORISTA PARCEIRO

Para operar na plataforma, o Motorista deve:
• Possuir CNH válida com a observação EAR (Exerce Atividade Remunerada) — Lei 9.503/1997, art. 143
• Manter o veículo em conformidade com as normas do CONTRAN (Resolução 701/2022 e anteriores)
• Possuir Seguro DPVAT e seguro de responsabilidade civil vigentes
• Manter documentação do veículo regularizada junto ao DETRAN
• Estar inscrito no MEI ou possuir CNPJ ativo para emissão de nota fiscal, conforme LC 128/2008

4. OBRIGAÇÕES DO MOTORISTA PARCEIRO

4.1. Prestar o serviço com qualidade, segurança e profissionalismo, conforme art. 14 do CDC.
4.2. Garantir que o guincho esteja em perfeitas condições de uso e com todos os equipamentos de segurança exigidos pela legislação.
4.3. Fornecer nota fiscal ou recibo ao Cliente após cada serviço prestado.
4.4. Manter seus dados cadastrais atualizados, incluindo a chave PIX para recebimento.
4.5. Não solicitar ou aceitar pagamentos fora da plataforma de forma que burle o sistema de avaliação.
4.6. Tratar Clientes com respeito e profissionalismo, vedada qualquer discriminação.
4.7. Cumprir os horários comprometidos e comunicar imediatamente qualquer atraso ao Cliente.

5. SERVIÇOS DE GUINCHO — REGULAMENTAÇÃO

5.1. Os serviços de guincho e reboque são regulamentados pelo CTB (Lei 9.503/1997), Resolução CONTRAN 701/2022 e normas estaduais/municipais aplicáveis.
5.2. O Motorista é EXCLUSIVAMENTE responsável pelo cumprimento das normas de trânsito e regulamentações de transporte durante a execução do serviço.
5.3. Qualquer infração de trânsito durante o serviço é responsabilidade exclusiva do Motorista Parceiro.
5.4. A ReboCar não se responsabiliza por danos causados pelo Motorista ao veículo do Cliente ou a terceiros.

6. REMUNERAÇÃO E PAGAMENTOS

6.1. O Motorista recebe diretamente do Cliente via PIX ou outro meio acordado entre as partes.
6.2. A ReboCar poderá cobrar comissão sobre os serviços realizados, conforme tabela vigente disponível no aplicativo.
6.3. Em caso de disputas de pagamento, a ReboCar atuará como mediadora, sem responsabilidade pelo pagamento ao Motorista.
6.4. O Motorista é responsável pelo recolhimento de tributos sobre seus rendimentos (IRPF, INSS ou MEI).

7. AVALIAÇÕES E QUALIDADE

7.1. Os Clientes poderão avaliar o serviço prestado. Avaliações sistematicamente baixas podem resultar em suspensão da conta.
7.2. A ReboCar poderá desativar contas com média inferior a 3,0 estrelas após aviso prévio de 7 dias.
7.3. Motoristas com reclamações de danos a veículos ou comportamento inadequado serão investigados e poderão ser banidos.

8. SUSPENSÃO E ENCERRAMENTO DE CONTA

A ReboCar poderá suspender ou encerrar imediatamente a conta do Motorista em casos de:
• Fraude ou falsidade documental
• Comportamento inadequado com clientes
• Dano intencional a veículos
• Violação das normas de trânsito durante o serviço
• Uso da plataforma para fins ilícitos

9. PROTEÇÃO DO CONSUMIDOR

O Motorista Parceiro presta serviço diretamente ao consumidor final e deve observar o CDC (Lei 8.078/1990), especialmente:
• Art. 6º: direitos básicos do consumidor
• Art. 14: responsabilidade pelo fato do serviço
• Art. 20: vício na prestação do serviço

10. LEI APLICÁVEL E FORO

Estes Termos são regidos pelas leis brasileiras. Conflitos serão resolvidos perante o foro do domicílio do Motorista, salvo acordo entre as partes.

Contato: parceiros@rebocar.com.br
`;

const PRIVACY_CONTENT = `
POLÍTICA DE PRIVACIDADE — REBOCAR DRIVER
Versão 1.0 — Vigência: a partir de 01/06/2025
Encarregado de Dados (DPO): privacidade@rebocar.com.br

Esta Política foi elaborada em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018).

1. CONTROLADOR DOS DADOS

ReboCar Tecnologia e Serviços Ltda.
CNPJ: XX.XXX.XXX/0001-XX
DPO: privacidade@rebocar.com.br

2. DADOS COLETADOS DO MOTORISTA PARCEIRO

2.1. Dados de identificação (sensíveis — art. 5º, II, LGPD):
• Nome completo
• CPF (tratado como dado pessoal sensível para fins de verificação)
• Data de nascimento
• Número da CNH
• Fotos da CNH (frente e verso)

2.2. Dados profissionais:
• Modelo e placa do veículo
• Tipos de serviço oferecidos
• Chave PIX para recebimentos

2.3. Dados operacionais:
• Localização GPS (contínua quando online — necessário para receber chamados)
• Histórico de serviços prestados
• Avaliações recebidas

2.4. Dados de acesso:
• Logs de login (art. 15, Marco Civil da Internet)
• Dados de dispositivo (para segurança)

3. FINALIDADE E BASE LEGAL (art. 7º e 11 LGPD)

• Verificação de habilitação e documentação — Obrigação legal (art. 7º, II) e execução de contrato
• Operação do serviço de intermediação — Execução de contrato (art. 7º, V)
• Localização GPS quando online — Consentimento explícito + execução de contrato
• Prevenção de fraudes — Legítimo interesse (art. 7º, IX)
• CPF/CNH: tratamento justificado pelo art. 11, §2º, b e d (execução de contrato; prevenção à fraude)

4. COMPARTILHAMENTO

• Clientes: nome, foto de perfil e avaliação durante o atendimento
• Google Firebase: infraestrutura de armazenamento (EUA — DPF certificado)
• Autoridades públicas: quando exigido por lei, decisão judicial ou regulatório do DETRAN/CONTRAN
• Não compartilhamos CPF, CNH ou dados bancários com terceiros não autorizados

5. RETENÇÃO

• Dados de conta: vigência + 5 anos (prazo prescricional)
• Documentos CNH: 6 meses após encerramento da conta
• Logs de acesso: 6 meses (Marco Civil da Internet)
• Dados de serviços: 5 anos (obrigação fiscal)

6. SEUS DIREITOS (art. 18 LGPD)

✓ Acesso aos seus dados
✓ Correção de dados incorretos
✓ Eliminação de dados desnecessários
✓ Portabilidade
✓ Revogação de consentimento
✓ Solicitar exclusão de conta (art. 18, VI)

Para exercer: privacidade@rebocar.com.br
Resposta em até 15 dias úteis (art. 18, §3º, LGPD)

Para solicitar exclusão: Configurações > Privacidade > Solicitar Exclusão de Dados.

7. SEGURANÇA

• Criptografia TLS em trânsito
• Autenticação via Firebase Auth
• Acesso ao banco restrito por regras de segurança (Firestore Rules)
• Incidentes comunicados conforme art. 48, LGPD

8. CONTATO E DPO

DPO: privacidade@rebocar.com.br
Telefone: (XX) XXXX-XXXX

ANPD (Autoridade Nacional de Proteção de Dados):
www.gov.br/anpd
`;

export default function LegalScreen({ route }: Props) {
  const navigation = useNavigation();
  const isTerms = route?.params?.type === 'terms';
  const title = isTerms ? 'Termos de Uso — Parceiro' : 'Política de Privacidade';
  const content = isTerms ? TERMS_CONTENT : PRIVACY_CONTENT;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#27AE60" />
          <Text style={styles.infoText}>
            Documento em conformidade com a LGPD (Lei 13.709/2018)
          </Text>
        </View>

        <Text style={styles.body}>{content.trim()}</Text>

        <View style={styles.footer}>
          <Ionicons name="lock-closed-outline" size={14} color="#555" />
          <Text style={styles.footerText}>
            Seus dados são tratados com segurança e transparência.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B2A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    backgroundColor: '#1C2D3E',
    borderBottomWidth: 1,
    borderBottomColor: '#2A3D50',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0D1B2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 14, fontWeight: '800', color: '#fff', flex: 1, textAlign: 'center' },
  content: { padding: 20, paddingBottom: 48 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(39,174,96,0.15)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(39,174,96,0.3)',
  },
  infoText: { flex: 1, fontSize: 12, color: '#27AE60', fontWeight: '600' },
  body: {
    fontSize: 13,
    color: '#aaa',
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 28,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A3D50',
  },
  footerText: { fontSize: 11, color: '#555' },
});
