import mongoose from 'mongoose';

const slugify = (value = '') => value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\u0111/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const participantSchema = new mongoose.Schema({
    type:{
        type:String,
        enum:['team', 'player'],
        required: true
    },
    tournamentItemId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'TournamentItem'
    },

    name:{
        type:String,
        required:true,
        trim:true
    },

    slug: {
        type: String,
        trim: true,
        default: ''
    },

    logo:{
        type:String
    },

    registrationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'suspended'],
        default: 'pending'
    },

    paymentStatus: {
        type: String,
        enum: ['unpaid', 'paid', 'exempted'],
        default: 'unpaid'
    },

    source: {
        type: String,
        enum: ['user', 'organization', 'import'],
        default: 'user'
    },

    representative: {
        name: { type: String, default: '' },
        phone: { type: String, default: '' },
        email: { type: String, default: '' }
    },

    lineup:[{
        Player:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Player'
        }
    }],

    memberFees: [{
        playerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Player'
        },
        amount: { type: Number, default: 0 },
        amountPaid: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ['unpaid', 'pending', 'paid', 'rejected', 'exempted'],
            default: 'unpaid'
        },
        receiptImage: { type: String, default: '' },
        paidAt: { type: Date, default: null },
        submittedAt: { type: Date, default: null },
        reviewedAt: { type: Date, default: null },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        method: { type: String, default: '' },
        transactionCode: { type: String, default: '' },
        note: { type: String, default: '' },
        rejectReason: { type: String, default: '' }
    }]

},
{timestamps:true});

participantSchema.pre('validate', async function ensureSlug(next) {
    if (!this.slug) {
        const base = slugify(this.name) || 'doi-thi';
        let candidate = base;
        let index = 1;
        const query = { slug: candidate };
        if (this._id) query._id = { $ne: this._id };
        while (await this.constructor.exists(query)) {
            index += 1;
            candidate = `${base}-${index}`;
            query.slug = candidate;
        }
        this.slug = candidate;
    }
    next();
});

participantSchema.index({ slug: 1 }, { unique: true, sparse: true });

const Participant = mongoose.model('Participant', participantSchema);
export default Participant;
