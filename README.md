# BJJ Tournament Manager

Frontend web para gerenciamento de torneios de jiu-jitsu. A aplicação permite acompanhar equipes, atletas, categorias e lutas em um painel único.

## Funcionalidades

- Dashboard com contadores e informações recentes.
- Cadastro, edição e exclusão de equipes.
- Cadastro, edição e exclusão de atletas.
- Cadastro, edição e exclusão de categorias.
- Cadastro, edição e exclusão de lutas.
- Associação entre equipes, atletas e categorias.
- Status da API exibido na barra lateral.
- Interface responsiva com tema escuro.

## Tecnologias

- HTML5
- CSS3
- JavaScript vanilla
- API REST externa
- Fonte Inter, carregada pelo Google Fonts

## Estrutura

```text
.
├── index.html   # Estrutura das telas e modais
├── script.js    # Navegação, chamadas à API e operações CRUD
├── style.css    # Layout, tema e responsividade
└── README.md
```

## Pré-requisitos

- Um navegador moderno com suporte a `fetch` e `AbortSignal.timeout`.
- Uma API REST executando em `http://localhost:8080`.
- CORS habilitado na API para permitir requisições feitas pelo frontend.

## Como executar

Como o projeto é estático, pode ser servido por qualquer servidor HTTP local.

Com Python:

```bash
python -m http.server 5500
```

Depois, abra:

```text
http://localhost:5500
```

Também é possível usar a extensão Live Server do VS Code.

> Evite abrir o arquivo diretamente com `file://`, pois o navegador pode bloquear as requisições para a API.

## API esperada

O endereço da API é definido no início de `script.js`:

```javascript
const API = 'http://localhost:8080';
```

Endpoints utilizados:

| Recurso | Listar | Criar | Atualizar | Excluir |
| --- | --- | --- | --- | --- |
| Equipes | `GET /teams` | `POST /teams` | `PUT /teams/:id` | `DELETE /teams/:id` |
| Atletas | `GET /athletes` | `POST /athletes` | `PUT /athletes/:id` | `DELETE /athletes/:id` |
| Categorias | `GET /categories` | `POST /categories` | `PUT /categories/:id` | `DELETE /categories/:id` |
| Lutas | `GET /matches` | `POST /matches` | `PUT /matches/:id` | `DELETE /matches/:id` |

As requisições de criação e atualização usam `Content-Type: application/json`.

### Exemplos de payload

Equipe:

```json
{
  "teamName": "Gracie Barra"
}
```

Atleta:

```json
{
  "name": "João Silva",
  "belt": "Azul",
  "gender": "Masculino",
  "weight": 82.5,
  "age": 25,
  "isFighting": "Não",
  "team": { "id": 1 },
  "category": { "id": 1 }
}
```

Categoria:

```json
{
  "category_name": "Adulto Meio-Pesado",
  "belt": "Azul",
  "gender": "Masculino",
  "max_weight": 88.3,
  "max_age": 30
}
```

Luta:

```json
{
  "athlete1": { "id": 1 },
  "athlete2": { "id": 2 },
  "category": { "id": 1 },
  "winner": { "id": 1 },
  "matchStatus": "Agendada"
}
```

Os valores possíveis de status de uma luta são `Agendada`, `Em Andamento` e `Finalizada`.

## Observações

- Ao iniciar, o frontend verifica a API usando `GET /teams`.
- Se a API estiver indisponível, a interface continua carregando, mas as operações de dados não funcionarão.
- O frontend espera que os relacionamentos retornados pela API incluam objetos como `team`, `category`, `athlete1` e `athlete2` quando aplicável.